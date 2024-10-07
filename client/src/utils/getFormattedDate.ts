import dayjs from "dayjs";
import localizedFormat from "dayjs/plugin/localizedFormat";

dayjs.extend(localizedFormat);

export function getFormattedDate() {
  const date = dayjs();
  const day = date.format("ddd"); // Short day of the week (e.g., Thu)
  const dayOfMonth = date.format("D"); // Day of the month
  const month = date.format("MMM"); // Short month (e.g., Aug)
  const time = date.format("h:mmA"); // Time with AM/PM (e.g., 2:30PM)

  // Get suffix for day (st, nd, rd, th)
  const suffix =
    dayOfMonth === "1" || dayOfMonth === "21" || dayOfMonth === "31"
      ? "st"
      : dayOfMonth === "2" || dayOfMonth === "22"
        ? "nd"
        : dayOfMonth === "3" || dayOfMonth === "23"
          ? "rd"
          : "th";

  return `${day}, ${dayOfMonth}${suffix} ${month} ${time} Bill`;
}
