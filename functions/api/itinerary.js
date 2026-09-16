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
   GET /api/itinerary
   Anyone can read
========================= */

export async function onRequestGet(context) {

  try {

    const result =
      await context.env.DB
        .prepare(`
          SELECT
            id,
            day,
            time,
            title,
            details,
            location,
            sort_order,
            created_at
          FROM itinerary_items
          ORDER BY day ASC, sort_order ASC, id ASC
        `)
        .all();


    return Response.json({
      success: true,
      items: result.results
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
   POST /api/itinerary
   Add activity
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


    const day =
      Number(body.day);

    const time =
      String(body.time || "").trim();

    const title =
      String(body.title || "").trim();

    const details =
      String(body.details || "").trim();

    const location =
      String(body.location || "").trim();


    if (
      !Number.isInteger(day) ||
      day < 1 ||
      day > 3
    ) {

      return Response.json(
        {
          success: false,
          error: "Invalid day."
        },
        { status: 400 }
      );
    }


    if (!time || !title) {

      return Response.json(
        {
          success: false,
          error:
            "Time and title are required."
        },
        { status: 400 }
      );
    }


    if (
      title.length > 200 ||
      details.length > 500 ||
      location.length > 300
    ) {

      return Response.json(
        {
          success: false,
          error: "Entry is too long."
        },
        { status: 400 }
      );
    }


    /*
      Put new activity at
      the end of that day.
    */

    const orderResult =
      await context.env.DB
        .prepare(`
          SELECT
            COALESCE(
              MAX(sort_order),
              0
            ) AS max_order
          FROM itinerary_items
          WHERE day = ?
        `)
        .bind(day)
        .first();


    const sortOrder =
      Number(
        orderResult?.max_order || 0
      ) + 1;


    const result =
      await context.env.DB
        .prepare(`
          INSERT INTO itinerary_items
          (
            day,
            time,
            title,
            details,
            location,
            sort_order
          )
          VALUES (?, ?, ?, ?, ?, ?)
        `)
        .bind(
          day,
          time,
          title,
          details,
          location,
          sortOrder
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
   PATCH /api/itinerary
   Edit activity
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

    const day =
      Number(body.day);

    const time =
      String(body.time || "").trim();

    const title =
      String(body.title || "").trim();

    const details =
      String(body.details || "").trim();

    const location =
      String(body.location || "").trim();


    if (
      !Number.isInteger(id) ||
      id <= 0
    ) {

      return Response.json(
        {
          success: false,
          error:
            "Valid itinerary ID is required."
        },
        { status: 400 }
      );
    }


    if (
      !Number.isInteger(day) ||
      day < 1 ||
      day > 3
    ) {

      return Response.json(
        {
          success: false,
          error: "Invalid day."
        },
        { status: 400 }
      );
    }


    if (!time || !title) {

      return Response.json(
        {
          success: false,
          error:
            "Time and title are required."
        },
        { status: 400 }
      );
    }


    if (
      title.length > 200 ||
      details.length > 500 ||
      location.length > 300
    ) {

      return Response.json(
        {
          success: false,
          error: "Entry is too long."
        },
        { status: 400 }
      );
    }


    await context.env.DB
      .prepare(`
        UPDATE itinerary_items
        SET
          day = ?,
          time = ?,
          title = ?,
          details = ?,
          location = ?
        WHERE id = ?
      `)
      .bind(
        day,
        time,
        title,
        details,
        location,
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
   DELETE /api/itinerary?id=123
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
            "Valid itinerary ID is required."
        },
        { status: 400 }
      );
    }


    await context.env.DB
      .prepare(`
        DELETE FROM itinerary_items
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
