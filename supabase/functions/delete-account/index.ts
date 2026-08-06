import { serve } from "https://deno.land/std/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Gestion du preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  const authHeader = req.headers.get("Authorization");

  if (!authHeader) {
    return new Response(
      JSON.stringify({
        error: "Missing authorization",
      }),
      {
        status: 401,
        headers: corsHeaders,
      },
    );
  }

  const supabaseAdmin = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const token = authHeader.replace("Bearer ", "");

  const {
    data: { user },
    error,
  } = await supabaseAdmin.auth.getUser(token);

  if (error || !user) {
    return new Response(
      JSON.stringify({
        error: "Invalid user",
      }),
      {
        status: 401,
        headers: corsHeaders,
      },
    );
  }

  const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(
    user.id,
  );

  if (deleteError) {
    return new Response(
      JSON.stringify({
        error: deleteError.message,
      }),
      {
        status: 400,
        headers: corsHeaders,
      },
    );
  }

  return new Response(
    JSON.stringify({
      success: true,
    }),
    {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    },
  );
});
