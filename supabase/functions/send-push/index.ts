import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.11.0";
import webpush from "npm:web-push@3.6.4";

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY")!;
const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY")!;

webpush.setVapidDetails(
  "mailto:admin@example.com",
  vapidPublicKey,
  vapidPrivateKey
);

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    const payload = await req.json();
    const message = payload.record; // from database webhook (INSERT into chat_messages)

    if (!message || !message.room_id || !message.user_id) {
      return new Response("Invalid payload", { status: 400 });
    }

    // Fetch the sender's name
    const { data: senderProfile } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", message.user_id)
      .single();
    
    const senderName = senderProfile?.full_name || "Студент";

    // Fetch the room name (for group chats)
    const { data: room } = await supabase
      .from("chat_rooms")
      .select("name, type")
      .eq("id", message.room_id)
      .single();
      
    let title = senderName;
    if (room && room.type === 'group') {
      title = `${senderName} в ${room.name}`;
    }

    let bodyText = message.content || 'Отправил(а) вложение 📎';

    // Fetch all push subscriptions for users in this room (excluding sender)
    // Note: Since users are not explicitly tied to group rooms in chat_participants (group is global for group_id),
    // we fetch all subscriptions EXCEPT the sender. 
    // For direct chats, we fetch the specific participant.
    
    let targetUserIds: string[] = [];
    
    if (room?.type === 'direct') {
      const { data: participants } = await supabase
        .from('chat_participants')
        .select('user_id')
        .eq('room_id', message.room_id)
        .neq('user_id', message.user_id);
        
      targetUserIds = participants?.map(p => p.user_id) || [];
    } else {
      // For group chat, get everyone in the same group_id as the sender
      const { data: senderData } = await supabase
        .from('profiles')
        .select('group_id')
        .eq('id', message.user_id)
        .single();
        
      if (senderData?.group_id) {
        const { data: groupUsers } = await supabase
          .from('profiles')
          .select('id')
          .eq('group_id', senderData.group_id)
          .neq('id', message.user_id);
          
        targetUserIds = groupUsers?.map(u => u.id) || [];
      }
    }

    if (targetUserIds.length === 0) {
      return new Response("No target users", { status: 200 });
    }

    // Get push subscriptions
    const { data: subscriptions, error: subError } = await supabase
      .from("push_subscriptions")
      .select("*")
      .in("user_id", targetUserIds);

    if (subError || !subscriptions || subscriptions.length === 0) {
      return new Response("No subscriptions found", { status: 200 });
    }

    const notificationPayload = JSON.stringify({
      title,
      body: bodyText,
      data: { url: `/chat/${message.room_id}` }
    });

    const sendPromises = subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: {
          p256dh: sub.p256dh,
          auth: sub.auth,
        }
      };

      try {
        await webpush.sendNotification(pushSubscription, notificationPayload);
      } catch (error: any) {
        // If subscription is invalid/expired, delete it
        if (error.statusCode === 410 || error.statusCode === 404) {
          await supabase.from("push_subscriptions").delete().eq("id", sub.id);
        } else {
          console.error("Push Error:", error);
        }
      }
    });

    await Promise.all(sendPromises);

    return new Response(JSON.stringify({ success: true, count: sendPromises.length }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error(error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
