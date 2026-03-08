import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const emailTemplates: Record<string, (vars: Record<string, string>) => { subject: string; html: string }> = {
  welcome: (vars) => ({
    subject: `مرحباً ${vars.name} في Megsy AI! 🎉`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e5e5e5;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#7c3aed,#a855f7);padding:40px 30px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:28px">مرحباً في Megsy AI!</h1>
        </div>
        <div style="padding:30px">
          <p style="font-size:16px;line-height:1.8">مرحباً <strong>${vars.name}</strong>،</p>
          <p style="font-size:15px;line-height:1.8">يسعدنا انضمامك! حسابك جاهز مع <strong>10 MC</strong> رصيد مجاني.</p>
          <div style="text-align:center;margin:30px 0">
            <a href="${vars.app_url}" style="background:#7c3aed;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">ابدأ الآن</a>
          </div>
          <p style="font-size:13px;color:#888;text-align:center">Megsy AI - ذكاءك الاصطناعي</p>
        </div>
      </div>`,
  }),

  low_balance: (vars) => ({
    subject: `⚠️ رصيدك منخفض - ${vars.credits} MC متبقية`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e5e5e5;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#f59e0b,#ef4444);padding:30px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">⚠️ رصيدك منخفض</h1>
        </div>
        <div style="padding:30px">
          <p style="font-size:16px;line-height:1.8">مرحباً <strong>${vars.name}</strong>،</p>
          <p style="font-size:15px;line-height:1.8">رصيدك الحالي <strong>${vars.credits} MC</strong>. قم بشحن رصيدك للاستمرار في استخدام جميع الميزات.</p>
          <div style="text-align:center;margin:30px 0">
            <a href="${vars.app_url}/pricing" style="background:#f59e0b;color:#000;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px">شحن الرصيد</a>
          </div>
        </div>
      </div>`,
  }),

  transaction: (vars) => ({
    subject: `✅ تأكيد عملية: ${vars.action}`,
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e5e5e5;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#10b981,#059669);padding:30px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">✅ تأكيد العملية</h1>
        </div>
        <div style="padding:30px">
          <p style="font-size:16px;line-height:1.8">مرحباً <strong>${vars.name}</strong>،</p>
          <p style="font-size:15px;line-height:1.8">تم تنفيذ عملية <strong>${vars.action}</strong> بنجاح.</p>
          <div style="background:#1a1a2e;border-radius:10px;padding:16px;margin:20px 0">
            <p style="margin:4px 0;font-size:14px">المبلغ: <strong>${vars.amount}</strong></p>
            <p style="margin:4px 0;font-size:14px">الرصيد المتبقي: <strong>${vars.remaining} MC</strong></p>
          </div>
        </div>
      </div>`,
  }),

  newsletter: (vars) => ({
    subject: vars.subject || "📰 أخبار Megsy AI",
    html: `
      <div style="font-family:'Segoe UI',Arial,sans-serif;max-width:600px;margin:0 auto;background:#0a0a0a;color:#e5e5e5;border-radius:16px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#7c3aed,#3b82f6);padding:30px;text-align:center">
          <h1 style="color:#fff;margin:0;font-size:24px">${vars.subject || "أخبار Megsy AI"}</h1>
        </div>
        <div style="padding:30px">
          <div style="font-size:15px;line-height:1.8">${vars.content}</div>
          <div style="text-align:center;margin:30px 0">
            <a href="${vars.app_url}" style="background:#7c3aed;color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:600">افتح Megsy AI</a>
          </div>
          <p style="font-size:12px;color:#666;text-align:center;margin-top:30px">
            لإلغاء الاشتراك في النشرة، قم بتعديل إعدادات الإشعارات في حسابك.
          </p>
        </div>
      </div>`,
  }),
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { to, template, variables, subject, html, user_id, type } = await req.json();

    if (!to) throw new Error("Missing 'to' email address");

    const smtpHost = Deno.env.get("SMTP_HOST");
    const smtpPort = Number(Deno.env.get("SMTP_PORT") || "587");
    const smtpUser = Deno.env.get("SMTP_USER");
    const smtpPass = Deno.env.get("SMTP_PASS");
    const fromEmail = Deno.env.get("SMTP_FROM_EMAIL") || smtpUser;
    const fromName = Deno.env.get("SMTP_FROM_NAME") || "Megsy AI";

    if (!smtpHost || !smtpUser || !smtpPass) {
      throw new Error("SMTP credentials not configured");
    }

    let emailSubject = subject || "Megsy AI";
    let emailHtml = html || "";

    if (template && emailTemplates[template]) {
      const tpl = emailTemplates[template](variables || {});
      emailSubject = tpl.subject;
      emailHtml = tpl.html;
    }

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
      to,
      subject: emailSubject,
      html: emailHtml,
    });

    await client.close();

    // Log email
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    await supabase.from("email_logs").insert({
      user_id: user_id || null,
      to_email: to,
      subject: emailSubject,
      type: type || template || "general",
      status: "sent",
    });

    // Also create in-app notification if user_id provided
    if (user_id && template) {
      const tpl = emailTemplates[template]?.(variables || {});
      if (tpl) {
        await supabase.rpc("create_notification", {
          p_user_id: user_id,
          p_type: type || "system",
          p_title: tpl.subject.replace(/[🎉⚠️✅📰]/g, "").trim(),
          p_message: `تم إرسال إيميل: ${tpl.subject}`,
        });
      }
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("send-email error:", e);
    return new Response(
      JSON.stringify({ success: false, error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
