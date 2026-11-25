import { useEffect, useState } from "react";
import { apiRequest } from "../services/api";

export default function MyBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadBookings() {
      try {
        const data = await apiRequest("/api/bookings/my");
        if (active) setBookings(data.bookings);
      } catch (err) {
        if (active) setError(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadBookings();
    return () => { active = false; };
  }, []);

  if (loading) return <p>Loading bookings...</p>;
  if (error) return <p role="alert">{error}</p>;

  return (
    <main>
      <h1>My Bookings</h1>
      {bookings.length === 0 ? (
        <p>You have no bookings yet.</p>
      ) : (
        bookings.map((booking) => (
          <article key={booking.id}>
            <h2>{booking.session_title}</h2>
            <p>{new Date(booking.start_time).toLocaleString()}</p>
            <p>Instructor: {booking.instructor_name || "Not assigned"}</p>
            <p>Status: {booking.status}</p>
            <p>Price: {booking.price}</p>
          </article>
        ))
      )}
    </main>
  );
}
