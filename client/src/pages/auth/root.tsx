export default function Root() {
  async function LoginHandler() {
    try {
      const response = await fetch("http://localhost:5000/auth/google");
      const sth: { redirect: string } = await response.json();

      console.log("yayyy", sth);
      if (sth.redirect) {
        window.location.href = sth.redirect;
      }
    } catch (e) {
      console.error(e);
    }
  }
  return (
    <div>
      <h2> Paystack P2P Payment Sharing </h2>
      <button onClick={LoginHandler}>Google Login</button>{" "}
    </div>
  );
}
