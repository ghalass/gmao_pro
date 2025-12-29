// POST /api/auth/register/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { getScopedI18n } from "@/locales/server";

export async function POST(request: Request) {
  try {
    const registerTrans = await getScopedI18n("apis");

    const body = await request.json();
    const { entrepriseName, email, name, password, lang } = body;

    // check if data exist
    if (!body) {
      return NextResponse.json(
        { message: registerTrans("common.checkBody") },
        { status: 400 }
      );
    }

    // check if entrepriseName not exist
    const entrepiseExist = await prisma.entreprise.findFirst({
      where: { name: entrepriseName },
    });
    if (entrepiseExist)
      return NextResponse.json(
        { message: registerTrans("auth.register.checkExistEntrepiseName") },
        { status: 400 }
      );

    // check if admin role exist, if not existe must create new
    const adminRole = await prisma.role.findFirst({ where: { name: "admin" } });
    if (!adminRole) {
      const role = await prisma.role.create({ data: { name: "admin" } });
      body.role = [role.id];
    } else {
      body.role = [adminRole.id];
    }

    // check if email exist
    const emailExist = await prisma.user.findFirst({ where: { email } });
    if (emailExist)
      return NextResponse.json(
        { message: registerTrans("auth.register.emailUsed") },
        { status: 400 }
      );

    // create entreprise
    const entreprise = await prisma.entreprise.create({
      data: { name: entrepriseName, lang },
    });

    // create user with admin role and entrprise isOwner=true
    const hashedPassword = await hashPassword(password);
    await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        isOwner: true,
        active: true,
        roles: {
          connect: [{ id: body.role[0] }],
        },
        entreprise: {
          connect: { id: entreprise.id },
        },
      },
      include: {
        roles: {
          include: {
            permissions: true,
          },
        },
      },
    });
    return NextResponse.json({ status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/auth/register:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    );
  }
}
