import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { supabase } from "../services/supabaseClient";
import { addNotification } from "../store/slices/notificationsSlice";

/**
 * Background component that listens for real-time notifications via Supabase.
 * It connects when the user is logged in and disconnects when they log out.
 */
export default function NotificationListener() {
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  useEffect(() => {
    if (!supabase || !isAuthenticated || !user?.id) return;

    // Subscribe to new rows in the 'notifications' table for this specific user
    const channel = supabase
      .channel(`new_notifications_${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log("Real-time notification received:", payload.new);
          dispatch(addNotification(payload.new));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [isAuthenticated, user?.id, dispatch]);

  return null; // This component doesn't render anything UI-wise
}
