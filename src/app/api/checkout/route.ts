import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { getClientIdentifier, rateLimit } from "@/lib/rate-limit";

// Use default API version to satisfy Stripe typings during build
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const checkoutSchema = z.object({
  studentName: z.string().trim().min(1).max(120),
  yearLevel: z.string().trim().regex(/^\d{1,2}$/),
  courseName: z.string().trim().min(1).max(200),
  parentEmail: z.string().email().max(254),
  studentId: z.string().trim().min(10).max(128),
  subjectCount: z.number().int().positive().max(10).optional(),
  selections: z
    .array(
      z.object({
        courseName: z.string().trim().min(1).max(200),
      })
    )
    .optional(),
});

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
    const limiter = rateLimit({
      key: `${getClientIdentifier(request)}:checkout`,
      limit: 8,
      windowMs: 120_000,
    });

    if (!limiter.success) {
      return NextResponse.json(
        { error: "Too many checkout attempts. Please wait and try again." },
        {
          status: 429,
          headers: {
            "Retry-After": String(Math.max(Math.ceil((limiter.resetAt - Date.now()) / 1000), 1)),
          },
        }
      );
    }

    const body = await request.json();
    const parsed = checkoutSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid checkout data", detail: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { studentName, yearLevel, courseName, parentEmail, studentId, subjectCount, selections } = parsed.data;

    let amount = 0;
    if (selections && Array.isArray(selections) && selections.length > 0) {
      amount = selections.reduce((sum: number, s) => sum + getGranularPrice(s.courseName), 0);
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
    const message = error instanceof Error ? error.message : String(error || "Unknown error");
    console.error("Checkout error", { message });
    return NextResponse.json(
      { error: "Checkout failed" },
      { status: 500 }
    );
  }
}
