const passwordHash = await bcrypt.hash(
  process.env.ADMIN_PASSWORD,
  12
);

await prisma.user.upsert({
  where:{
    email: process.env.ADMIN_EMAIL
  },
  update:{},
  create:{
    name:"Administrator",
    email:process.env.ADMIN_EMAIL,
    passwordHash,
    role:"ADMIN",
    status:"ACTIVE"
  }
});