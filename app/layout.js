import "./globals.css";
import "./home-mockup.css";

export const metadata = {
  title: "ระบบข้อมูลโรงเรียนบ้านแฮดศึกษา",
  description: "ระบบข้อมูลนักเรียนและบุคลากร โรงเรียนบ้านแฮดศึกษา",
};

export default function RootLayout({ children }) {
  return (
    <html lang="th">
      <body>{children}</body>
    </html>
  );
}
