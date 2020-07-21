### 类游览器 Tab 功能的实现

### 功能点

1. 根据路由变化，切换或者新开 tab 页面
2. 点击当前路由跳转当前路由
3. 关闭当前 tab
4. 路由缓存
5. 右击 tab 出现右击菜单栏
   4.1 关闭当前 tab
   4.2. 关闭所有 tab

### 实现思路：

#### 1.监听路由触发 tab 处理事件

1.tab 类

##### 属性

- tabs:tab 信息数组，默认存在一个标签 tab

##### 方法

- `addTab`: 新增（打开）一个 tab
- `deleteTab` : 删除（关闭）一个 tab
- `deleteAllTab`: 删除（关闭）所有 tab

```js
// 简化版代码
export default class NavTabs {
  tabs: Tab[];
  constructor() {
    this.tabs = [initTab];
  }
  // 添加tab
  addTab(val: Route) {
    if (!pathMaps.has(val.fullPath)) {
      this.tabs.push({
        // info
      });
    }
  }
  // 删除tab
  deleteTab(val: string) {
    const index = this.tabs.findIndex((item: Tab) => item.id === val);
    this.tabs.splice(index, 1);
  }
  // 删除所有tab
  deleteAllTab() {
    this.tabs.length = 1;
  }
}
```

2.historyRecords 历史路由记录

自行维护一套路由信息，用于路由返回时寻找上次 tab 对应的 fullpath。
使用路由自身的 back()，对于子路由或者默认返回某个默认路由的情况无法正确处理。
刷新当前路由，也会有找不到上一个路由可以返回的情况。

##### 属性

- list: 历史记录数组

##### 方法

```js
export default class HistoryRecord {
  list: Route[];
  constructor() {
    this.list = [];
  }
  // 添加一条记录
  addRecords(route: Route) {
    this.list = this.list.filter(
      (item: any) => item.fullPath !== route.fullPath
    );
    this.list.push(route);
  }
  // 更新一条记录
  updateRecords(newPath: Route, oldPath: string) {
    this.list = this.list.filter((item: any) => item.fullPath !== oldPath);
    this.list.push(newPath);
  }
  // 回退一条记录
  back() {
    if (this.list.length > 1) {
      this.list.pop();
      const currentRoute = this.list[this.list.length - 1];
      vm.$router.replace(currentRoute!.fullPath);
    } else {
      // 历史记录为空时，默认跳转默认路由
      this.list = [initRoute];
      vm.$router.replace('/');
    }
  }
  // 删除一条记录
  removeRecords(path: string) {
    const index = this.list.findIndex(
      (route: Route) => route.fullPath === path
    );
    if (index > -1) {
      return this.list.splice(index, 1);
    }
  }
  // 删除所有记录
  removeAllRecords() {
    this.list = [initRoute];
    vm.$router.replace({ path: initRoute.fullPath });
  }
}
```

#### 2.右击菜单

- 实现单例模式菜单，仅存在一个右击菜单
- 与 tabs 组件互相独立，降低耦合性
- 调用方便

```js
// 通过vue.extend的方式，创建一个组件的构造器
import Menu from "./menu.vue";
import Vue from "vue";
const MenuConstructor = Vue.extend(Menu);
let instance;
// const instances: VNode[] = [];
let uId = 0;
const $Menu = function (options: any = {}, fn: any) {
  if (!instance) {
    instance = new MenuConstructor({
      data: () => {
        return options;
      },
      methods: { itemClick: fn }
    });
    instance.id = ++uId;
    instance.$mount();
    document.body.append(instance.$el);
    instance.visible = true;
  } else {
    instance = Object.assign(instance, options);
    instance.visible = true;
    instance.itemClick = fn;
  }
  return instance;
};

$Menu.show = (options: any = {}, fn: any) => {
  return $Menu(options, fn);
};

$Menu.hide = (options: any = {}) => {
  instance.visible = false;
};

export default $Menu;
```

```js
// 调用方式
// 在vue原型对象上挂在$menu对象
vue.prototype.$menu = $Menu;
// 显示菜单
this.$menu.show(
  {
    list: [], // 菜单数组
    left: pageX + "px", // 菜单展示位置
    top: pageY + "px"
  },
  // 菜单点击的方法
  (type: string) => {
    this.itemClickFn(type, target.id);
  }
);
// 关闭菜单
this.$menu.hide();
```

#### 3.组件缓存

主要思路通过 keep-alive 进行组件缓存，但是由于一般的路由组件都没有特定的 key 值，所以在 keep-alive 中会以组件名称为唯一 key。
这样会导致一个问题，需要缓存多个参数不同的同个路由组件时会有问题。比如打开多个详情页面的情况。

##### 解决思路：

1. 根据 keep-alive 的源码逻辑，会优先去获取组件的 key 作为缓存的 key 值，所以需要给每个组件加上 key，且值唯一。
2. 不想去大面积在组件内部去实现这个逻辑，所以需要在统一入口进行处理。
3. 通过函数式组件的方式，对 keep-alive 进行一次封装，对于特殊的路由进行 key 的赋值。

```js
const names = ["detail"];
const isDef = (v: any) => {
  return v !== undefined && v !== null;
};
const getFirstComponentChild = (children: any) => {
  if (Array.isArray(children)) {
    for (const child of children) {
      const c = child;
      if (isDef(c) && isDef(c.componentOptions)) {
        return c;
      }
    }
  }
};
export default {
  name: "AKeepAlive",
  functional: true,
  render(h, context) {
    let name = "";
    try {
      const childVDom = getFirstComponentChild(context.slots().default);
      name =
        childVDom &&
        childVDom.componentOptions &&
        (childVDom.componentOptions.Ctor.options.name ||
          childVDom.componentOptions.tag);
      if (name && names.includes(name)) {
        // 此处使用路由的hash作为唯一值
        childVDom.key = `${window.location.hash}` || null;
      }
    } catch {
      console.log("can not get component name!");
    }
    return context.parent.$createElement(
      "keep-alive",
      context.data,
      context.children
    );
  }
};
```
