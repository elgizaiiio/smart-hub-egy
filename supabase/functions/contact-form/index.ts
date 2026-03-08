import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { formType, name, email, message, extraFields } = await req.json();

    if (!name || !email || !message) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    // 1. Generate AI auto-reply
    let aiReply = "Thank you for contacting us. We'll get back to you shortly.";

    if (LOVABLE_API_KEY) {
      try {
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              {
                role: "system",
                content: `You are the Megsy AI support team assistant. Write a professional, warm, and personalized auto-reply email response. 
Rules:
- Address the person by their first name
- Acknowledge their specific inquiry/issue
- Let them know we've received their message and our team will review it
- Provide a rough timeline (24-48 hours for support, 2-3 business days for enterprise)
- Keep it concise (3-4 short paragraphs max)
- Be friendly but professional
- Do NOT use emojis
- Write in English
- Do NOT include subject line, just the body text
- Form type: ${formType === "enterprise" ? "Enterprise Sales Inquiry" : "Support Request"}`
              },
              {
                role: "user",
                content: `Name: ${name}\nEmail: ${email}\nForm Type: ${formType}\nMessage: ${message}\n${extraFields ? `Additional Info: ${JSON.stringify(extraFields)}` : ""}`
              }
            ],
          }),
        });

        if (aiResponse.ok) {
          const aiData = await aiResponse.json();
          aiReply = aiData.choices?.[0]?.message?.content || aiReply;
        }
      } catch (aiErr) {
        console.error("AI reply generation failed:", aiErr);
      }
    }

    // 2. Save to database
    const { error: dbError } = await supabase.from("contact_submissions").insert({
      form_type: formType || "support",
      name,
      email,
      subject: extraFields?.subject || null,
      message,
      ai_reply: aiReply,
      reply_sent: false,
    });

    if (dbError) console.error("DB insert error:", dbError);

    // 3. Send auto-reply email to the user
    try {
      const smtpHost = Deno.env.get("SMTP_HOST");
      const smtpPort = Number(Deno.env.get("SMTP_PORT") || "587");
      const smtpUser = Deno.env.get("SMTP_USER");
      const smtpPass = Deno.env.get("SMTP_PASS");
      const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || smtpUser;
      const fromName = Deno.env.get("SMTP_FROM_NAME") || "Megsy AI";

      if (smtpHost && smtpUser && smtpPass) {
        const replyHtml = `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #e5e7eb">
            <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:36px 30px;text-align:center">
              <h1 style="color:#fff;margin:0;font-size:24px;font-weight:700;letter-spacing:-0.5px">We've Received Your Message</h1>
              <p style="color:rgba(255,255,255,0.8);margin:8px 0 0;font-size:14px">Megsy AI Support Team</p>
            </div>
            <div style="padding:32px 30px">
              ${aiReply.split("\n").filter(p => p.trim()).map(p => `<p style="font-size:15px;line-height:1.8;color:#374151;margin:0 0 16px">${p}</p>`).join("")}
              <div style="border-top:1px solid #e5e7eb;margin-top:28px;padding-top:20px;text-align:center">
                <a href="https://smart-hub-egy.lovable.app" style="background:#7c3aed;color:#fff;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:600;font-size:14px;display:inline-block">Visit Megsy AI</a>
              </div>
            </div>
            <div style="padding:16px 30px;background:#f9fafb;text-align:center">
              <p style="font-size:12px;color:#9ca3af;margin:0">This is an automated response from Megsy AI. Our team will follow up personally if needed.</p>
            </div>
          </div>`;

        const client = new SMTPClient({
          connection: {
            hostname: smtpHost,
            port: smtpPort,
            tls: smtpPort === 465,
            auth: { username: smtpUser, password: smtpPass },
          },
        });

        await client.send({
          from: `${fromName} <${fromEmail}>`,
          to: email,
          subject: formType === "enterprise"
            ? "Thank you for your enterprise inquiry — Megsy AI"
            : "We've received your request — Megsy AI",
          html: replyHtml,
        });

        await client.close();

        // Mark reply as sent
        await supabase
          .from("contact_submissions")
          .update({ reply_sent: true })
          .eq("email", email)
          .order("created_at", { ascending: false })
          .limit(1);

        // Log the email
        await supabase.from("email_logs").insert({
          to_email: email,
          subject: formType === "enterprise"
            ? "Thank you for your enterprise inquiry — Megsy AI"
            : "We've received your request — Megsy AI",
          type: "contact_reply",
          status: "sent",
        });
      }
    } catch (emailErr) {
      console.error("Email send error:", emailErr);
    }

    // 4. Send notification email to admin
    try {
      const smtpHost = Deno.env.get("SMTP_HOST");
      const smtpPort = Number(Deno.env.get("SMTP_PORT") || "587");
      const smtpUser = Deno.env.get("SMTP_USER");
      const smtpPass = Deno.env.get("SMTP_PASS");
      const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || smtpUser;
      const adminEmail = Deno.env.get("SMTP_FROM_EMAIL") || smtpUser;

      if (smtpHost && smtpUser && smtpPass && adminEmail) {
        const adminHtml = `
          <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e5e5e5;border-radius:16px;overflow:hidden">
            <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:28px 30px;text-align:center">
              <h1 style="color:#fff;margin:0;font-size:22px">New Contact Form Submission</h1>
            </div>
            <div style="padding:28px 30px">
              <div style="background:#1a1a2e;border-radius:10px;padding:16px;margin-bottom:16px">
                <p style="margin:4px 0;font-size:14px"><strong>Type:</strong> ${formType === "enterprise" ? "Enterprise Sales" : "Support"}</p>
                <p style="margin:4px 0;font-size:14px"><strong>Name:</strong> ${name}</p>
                <p style="margin:4px 0;font-size:14px"><strong>Email:</strong> ${email}</p>
                ${extraFields?.companyName ? `<p style="margin:4px 0;font-size:14px"><strong>Company:</strong> ${extraFields.companyName}</p>` : ""}
                ${extraFields?.country ? `<p style="margin:4px 0;font-size:14px"><strong>Country:</strong> ${extraFields.country}</p>` : ""}
              </div>
              <p style="font-size:13px;color:#888;margin-bottom:8px"><strong>Message:</strong></p>
              <p style="font-size:14px;line-height:1.7;background:#1a1a2e;border-radius:8px;padding:14px">${message}</p>
            </div>
          </div>`;

        const client = new SMTPClient({
          connection: {
            hostname: smtpHost,
            port: smtpPort,
            tls: smtpPort === 465,
            auth: { username: smtpUser, password: smtpPass },
          },
        });

        await client.send({
          from: `Megsy AI <${fromEmail}>`,
          to: adminEmail,
          subject: `[Contact] ${formType === "enterprise" ? "Enterprise" : "Support"}: ${name}`,
          html: adminHtml,
        });

        await client.close();
      }
    } catch (adminErr) {
      console.error("Admin email error:", adminErr);
    }

    return new Response(JSON.stringify({ success: true, aiReply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("contact-form error:", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
