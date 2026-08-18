function toPublicUser(user) {
  if (!user) return null;
  // tokenVersion est un detail interne du controle de session : il n a rien a
  // faire dans une reponse.
  const { passwordHash, tokenVersion, ...rest } = user;
  return rest;
}

module.exports = { toPublicUser };
