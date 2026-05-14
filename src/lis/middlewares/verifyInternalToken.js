function verifyInternalToken(req, res, next) {
  const token = req.headers["x-internal-token"];
  if (!process.env.INTERNAL_API_TOKEN)
    return res
      .status(500)
      .json({ ok: false, message: "Token interno no configurado" });
  if (token !== process.env.INTERNAL_API_TOKEN)
    return res
      .status(401)
      .json({ ok: false, message: "Token interno inválido" });
  next();
}
module.exports = verifyInternalToken;
