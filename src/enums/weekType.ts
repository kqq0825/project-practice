import EnumObj from "./enum";
enum Week {
  SUN = 1,
  MON,
  TUE,
  WED,
  THU,
  FRI,
  SAT
}
const WeekNames = new EnumObj({
  [Week.SUN]: "星期日",
  [Week.MON]: "星期一",
  [Week.TUE]: "星期二",
  [Week.WED]: "星期三",
  [Week.THU]: "星期四",
  [Week.FRI]: "星期五",
  [Week.SAT]: "星期六"
});
export { Week, WeekNames };
