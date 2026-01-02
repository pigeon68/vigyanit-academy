import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createAdminClient } from "@/lib/supabase/admin";

// Use default API version to satisfy Stripe typings during build
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

function getGranularPrice(courseName: string): number {
  const name = courseName.toLowerCase();
  if (name.includes("year 7") || name.includes("year 8") || name.includes("year 9") || name.includes("year 10")) {
    return 45000; // in cents
  }
  return 75000; // in cents
}

function getPrice(yearLevel: string): number {
  const year = parseInt(yearLevel);
  if (year >= 7 && year <= 10) return 45000;
  if (year >= 11 && year <= 12) return 75000;
  return 45000;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { studentName, yearLevel, courseName, parentEmail, studentId, subjectCount, selections } = body;

    if (!studentName || !yearLevel || !courseName || !parentEmail || !studentId) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    let amount = 0;
    if (selections && Array.isArray(selections) && selections.length > 0) {
      amount = selections.reduce((sum: number, s: any) => sum + getGranularPrice(s.courseName), 0);
    } else {
      const baseAmount = getPrice(yearLevel);
      const count = subjectCount || (courseName.includes(",") ? courseName.split(",").length : 1);
      amount = baseAmount * count;
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      mode: "payment",
      customer_email: parentEmail,
      line_items: [
        {
          price_data: {
            currency: "aud",
            product_data: {
                name: `Enrolment: ${courseName}`,
                description: `Tutoring enrolment for ${studentName} (Year ${yearLevel})`,
            },
            unit_amount: amount,
          },
          quantity: 1,
        },
      ],
      metadata: {
        studentId,
        studentName,
        yearLevel,
        courseName,
        parentEmail,
      },
      success_url: `${request.nextUrl.origin}/enrol/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/enrol/cancel`,
    });

    const supabase = createAdminClient();
    await supabase
      .from("students")
      .update({
        stripe_checkout_session_id: session.id,
        payment_status: "pending",
      })
      .eq("profile_id", studentId);

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Checkout failed" },
      { status: 500 }
    );
  }
}
