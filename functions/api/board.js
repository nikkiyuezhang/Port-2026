/* =========================
   TRIP CODE CHECK
========================= */

function checkTripCode(context) {

  const suppliedCode =
    context.request.headers.get(
      "X-Trip-Code"
    );

  const correctCode =
    context.env.TRIP_CODE;


  return (
    correctCode &&
    suppliedCode === correctCode
  );
}


/* =========================
   GET /api/board
   Anyone can read
========================= */

export async function onRequestGet(context) {

  try {

    const result =
      await context.env.DB
        .prepare(`
          SELECT id, person, text, created_at
          FROM board_notes
          ORDER BY id DESC
        `)
        .all();


    return Response.json({
      success: true,
      notes: result.results
    });


  } catch (error) {

    return Response.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}


/* =========================
   POST /api/board
   Trip Code required
========================= */

export async function onRequestPost(context) {

  try {

    if (!checkTripCode(context)) {

      return Response.json(
        {
          success: false,
          error: "Invalid Trip Code."
        },
        { status: 401 }
      );
    }


    const body =
      await context.request.json();


    const person =
      String(
        body.person || ""
      ).trim();


    const text =
      String(
        body.text || ""
      ).trim();


    if (!person || !text) {

      return Response.json(
        {
          success: false,
          error:
            "Person and text are required."
        },
        { status: 400 }
      );
    }


    if (text.length > 1000) {

      return Response.json(
        {
          success: false,
          error:
            "Note is too long."
        },
        { status: 400 }
      );
    }


    const allowedPeople = [
      "Nikki",
      "Danny",
      "Kelly",
      "Wade",
      "Phila",
      "Eliana",
      "Jayan",
      "Kaia"
    ];


    if (
      !allowedPeople.includes(person)
    ) {

      return Response.json(
        {
          success: false,
          error: "Invalid person."
        },
        { status: 400 }
      );
    }


    const result =
      await context.env.DB
        .prepare(`
          INSERT INTO board_notes
          (person, text)
          VALUES (?, ?)
        `)
        .bind(
          person,
          text
        )
        .run();


    return Response.json({
      success: true,
      id: result.meta.last_row_id
    });


  } catch (error) {

    return Response.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}


/* =========================
   DELETE /api/board?id=123
   Trip Code required
========================= */

export async function onRequestDelete(context) {

  try {

    if (!checkTripCode(context)) {

      return Response.json(
        {
          success: false,
          error: "Invalid Trip Code."
        },
        { status: 401 }
      );
    }


    const url =
      new URL(
        context.request.url
      );


    const id =
      Number(
        url.searchParams.get("id")
      );


    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      return Response.json(
        {
          success: false,
          error:
            "Valid note ID is required."
        },
        { status: 400 }
      );
    }


    await context.env.DB
      .prepare(`
        DELETE FROM board_notes
        WHERE id = ?
      `)
      .bind(id)
      .run();


    return Response.json({
      success: true
    });


  } catch (error) {

    return Response.json(
      {
        success: false,
        error: error.message
      },
      { status: 500 }
    );
  }
}
