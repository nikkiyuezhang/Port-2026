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
   GET /api/todo
   Anyone can read
========================= */

export async function onRequestGet(context) {

  try {

    const result =
      await context.env.DB
        .prepare(`
          SELECT id, text, assignee, completed, created_at
          FROM todo_tasks
          ORDER BY completed ASC, id DESC
        `)
        .all();


    return Response.json({
      success: true,
      tasks: result.results
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
   POST /api/todo
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


    const text =
      String(
        body.text || ""
      ).trim();


    const assignee =
      String(
        body.assignee || "Everyone"
      ).trim();


    if (!text) {

      return Response.json(
        {
          success: false,
          error:
            "Task text is required."
        },
        { status: 400 }
      );
    }


    if (text.length > 500) {

      return Response.json(
        {
          success: false,
          error:
            "Task is too long."
        },
        { status: 400 }
      );
    }


    const allowedAssignees = [
      "Everyone",
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
      !allowedAssignees.includes(
        assignee
      )
    ) {

      return Response.json(
        {
          success: false,
          error:
            "Invalid assignee."
        },
        { status: 400 }
      );
    }


    const result =
      await context.env.DB
        .prepare(`
          INSERT INTO todo_tasks
          (text, assignee, completed)
          VALUES (?, ?, 0)
        `)
        .bind(
          text,
          assignee
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
   PATCH /api/todo
   Trip Code required
========================= */

export async function onRequestPatch(context) {

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


    const id =
      Number(body.id);


    const completed =
      body.completed ? 1 : 0;


    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      return Response.json(
        {
          success: false,
          error:
            "Valid task ID is required."
        },
        { status: 400 }
      );
    }


    await context.env.DB
      .prepare(`
        UPDATE todo_tasks
        SET completed = ?
        WHERE id = ?
      `)
      .bind(
        completed,
        id
      )
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


/* =========================
   DELETE /api/todo?id=123
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
            "Valid task ID is required."
        },
        { status: 400 }
      );
    }


    await context.env.DB
      .prepare(`
        DELETE FROM todo_tasks
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
