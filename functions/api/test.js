export async function onRequestGet(context) {
  try {
    const result = await context.env.DB
      .prepare("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
      .all();

    return Response.json({
      success: true,
      message: "Port 2026 database connected!",
      tables: result.results
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
