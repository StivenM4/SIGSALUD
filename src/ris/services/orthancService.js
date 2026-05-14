function authHeader() {
  if (!process.env.ORTHANC_USERNAME) return {};
  const token = Buffer.from(
    `${process.env.ORTHANC_USERNAME}:${process.env.ORTHANC_PASSWORD || ""}`,
  ).toString("base64");
  return { Authorization: `Basic ${token}` };
}
async function toolsFind(query) {
  const response = await fetch(`${process.env.ORTHANC_URL}/tools/find`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeader() },
    body: JSON.stringify(query),
  });
  if (!response.ok)
    throw new Error("No fue posible consultar Orthanc /tools/find");
  return response.json();
}
module.exports = { toolsFind };
