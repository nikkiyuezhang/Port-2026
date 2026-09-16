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
   GET /api/expenses
   Anyone can read
========================= */

export async function onRequestGet(context) {

  try {

    const result =
      await context.env.DB
        .prepare(`
          SELECT
            id,
            description,
            amount,
            paid_by,
            split_type,
            created_at
          FROM expenses
          ORDER BY id DESC
        `)
        .all();


    return Response.json({
      success: true,
      expenses: result.results
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
   POST /api/expenses
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


    const description =
      String(
        body.description || ""
      ).trim();


    const amount =
      Number(body.amount);


    const paidBy =
      String(
        body.paid_by || ""
      ).trim();


    const splitType =
      String(
        body.split_type || "both"
      ).trim();


    /* VALIDATION */

    if (!description) {

      return Response.json(
        {
          success: false,
          error:
            "Description is required."
        },
        { status: 400 }
      );
    }


    if (
      !Number.isFinite(amount) ||
      amount <= 0
    ) {

      return Response.json(
        {
          success: false,
          error:
            "Valid amount is required."
        },
        { status: 400 }
      );
    }


    const allowedPayers = [
      "family1",
      "family2"
    ];


    if (
      !allowedPayers.includes(
        paidBy
      )
    ) {

      return Response.json(
        {
          success: false,
          error:
            "Invalid paying family."
        },
        { status: 400 }
      );
    }


    const allowedSplits = [
      "both",
      "family1",
      "family2"
    ];


    if (
      !allowedSplits.includes(
        splitType
      )
    ) {

      return Response.json(
        {
          success: false,
          error:
            "Invalid split type."
        },
        { status: 400 }
      );
    }


    /* SAVE TO D1 */

    const result =
      await context.env.DB
        .prepare(`
          INSERT INTO expenses
          (
            description,
            amount,
            paid_by,
            split_type
          )
          VALUES (?, ?, ?, ?)
        `)
        .bind(
          description,
          amount,
          paidBy,
          splitType
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
   DELETE /api/expenses?id=123
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
            "Valid expense ID is required."
        },
        { status: 400 }
      );
    }


    await context.env.DB
      .prepare(`
        DELETE FROM expenses
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
