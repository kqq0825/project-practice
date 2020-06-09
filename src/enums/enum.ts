type EnumConstructorParams = {
  [propretyName in number | string]: string;
};
export default class EnumObj {
  constructor(_p: EnumConstructorParams) {
    Object.assign(this, _p);
  }
  toList() {
    // Object.entries 方法会将 属性都转化为字符串，所以此处用正则判断 是否需要用Number()尽享转换
    return Object.entries(this).map((item: string[]) => {
      return {
        value: /^\d+$/.test(item[0]) ? Number(item[0]) : item[0],
        label: item[1]
      };
    });
  }
}
