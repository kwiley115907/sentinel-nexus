import { SpeedInsights } from '@vercel/speed-insights/next';
import "./globals.css";

export const metadata = {
  title: "Sentinel Nexus",
  description: "Low Voltage OS",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
