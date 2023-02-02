import { cloneDeep } from 'lodash-es'
import NotFindPage from '@/views/404.vue'
import { BlankLayoutPage, BasicLayoutPage } from 'components/Layout'
const pagesComponent = import.meta.glob('../views/**/*.vue', { eager: true });

/**
 * 权限信息
 */
export type PermissionInfo = {
  permission: string;
  actions: string[];
};

/**
 * 按钮信息
 */
export type MenuButtonInfo = {
  id: string;
  name: string;
  permissions: PermissionInfo;
  createTime: number;
  describe?: string;
  options: Record<string, any>;
};


export type MenuItem = {
  id: string;
  /**
   * 名称
   */
  name: string;
  /**
   * 编码
   */
  code: string;
  /**
   * 所属应用
   */
  application: string;
  /**
   * 描述
   */
  describe: string;
  /**
   * url，路由
   */
  url: string;
  /**
   * 图标
   */
  icon: string;
  /**
   * 状态, 0为禁用，1为启用
   */
  status: number;
  /**
   * 绑定权限信息
   */
  permissions: PermissionInfo[];
  /**
   * 按钮定义信息
   */
  buttons: MenuButtonInfo[];
  /**
   * 其他配置信息
   */
  options: Record<string, any>;
  /**
   * 父级ID
   */
  parentId: string;
  /**
   * 树结构路径
   */
  path: string;
  /**
   * 排序序号
   */
  sortIndex: number;
  /**
   * 树层级
   */
  level: number;
  createTime: number;
  redirect?: string;
  children?: MenuItem[];
  accessSupport?: { text: string; value: string };
  appId?: string; //应用id
  isShow?: boolean;
  meta?: {
    title?: string
    icon?: string
    [key: string]: any
  },
  component?: any
};

// 额外子级路由
const extraRouteObj = {
  'media/Cascade': {
    children: [
      { code: 'Save', name: '新增' },
      { code: 'Channel', name: '选择通道' },
    ],
  },
  'media/Device': {
    children: [
      { code: 'Save', name: '详情' },
      { code: 'Channel', name: '通道列表' },
      { code: 'Playback', name: '回放' },
    ],
  },
  'rule-engine/Scene': {
    children: [
      { code: 'Save', name: '详情' },
      { code: 'Save2', name: '测试详情' },
    ],
  },
  'rule-engine/Alarm/Configuration': {
    children: [{ code: 'Save', name: '详情' }],
  },
  'device/Firmware': {
    children: [{ code: 'Task', name: '升级任务' }],
  },
  demo: {
    children: [{ code: 'AMap', name: '地图' }],
  },
  'system/Platforms': {
    children: [
      { code: 'Api', name: '赋权' },
      { code: 'View', name: 'Api详情' },
    ],
  },
  'system/DataSource': {
    children: [{ code: 'Management', name: '管理' }],
  },
  'system/Menu': {
    children: [{ code: 'Setting', name: '菜单配置' }],
  },
  'system/Apply': {
    children: [
      { code: 'Api', name: '赋权' },
      { code: 'View', name: 'Api详情' },
      { code: 'Save', name: '详情' },
    ],
  },
};


const resolveComponent = (name: any) => {
  const importPage = pagesComponent[`../views/${name}/index.vue`];
  if (!importPage) {
    console.warn(`Unknown page ${name}. Is it located under Pages with a .vue extension?`)
  }
  //@ts-ignore
  return !!importPage ? importPage.default : undefined
}

const findChildrenRoute = (code: string, url: string, routes: any[] = []): MenuItem[] => {
  if (extraRouteObj[code]) {
    const extraRoutes = extraRouteObj[code].children.map((route: MenuItem) => {
      return {
        url: `${url}/${route.code}`,
        code: `${code}/${route.code}`,
        name: route.name,
        isShow: false
      }
    })
    return [...routes, ...extraRoutes]
  }
  return routes
}

const findDetailRouteItem = (code: string, url: string): Partial<MenuItem> | null => {
  const detailComponent = resolveComponent(`${code}/Detail`)
  if (detailComponent) {
    return {
      url: `${url}/Detail/:id`,
      code: `${code}/Detail`,
      component: detailComponent,
      name: '详情信息',
      isShow: false
    }
  }
  return null
}

const findDetailRoutes = (routes: any[]): any[] => {
  const newRoutes: any[] = []
  routes.forEach((route: any) => {
    newRoutes.push(route)
    const detail = findDetailRouteItem(route.code, route.url)
    if (detail) {
      newRoutes.push(detail)
    }
  })
  return newRoutes
}

export function filterAsnycRouter(asyncRouterMap: any, parentCode = '', level = 1): { menusData: any, silderMenus: any } {
  const _asyncRouterMap = cloneDeep(asyncRouterMap)
  const menusData: any[] = []
  const silderMenus: any[] = []
  _asyncRouterMap.forEach((route: any) => {
    const _route: any = {
      path: `${route.url}`,
      meta: {
        icon: route.icon,
        title: route.name,
        hideInMenu: route.isShow === false,
        buttons: route.buttons || []
      }
    }

    const silder = {..._route}

    // 查看是否有隐藏子路由
    route.children = findChildrenRoute(route.code, route.url, route.children)
    route.children = findDetailRoutes(route.children)
    if (route.children && route.children.length) {
      // TODO 查看是否具有详情页
      const { menusData: _menusData, silderMenus: _silderMenus } = filterAsnycRouter(route.children, `${parentCode}/${route.code}`, level + 1)
      _route.children = _menusData
      silder.children = _silderMenus
      const showChildren = _route.children.some((r: any) => !r.meta.hideInMenu)
      if (showChildren) {
        _route.component = () => level === 1 ? BasicLayoutPage : BlankLayoutPage
        _route.redirect = route.children[0].url
      } else {
        const myComponent = resolveComponent(route.code)
        _route.component = myComponent ? myComponent : BlankLayoutPage;
        if (!!myComponent) {
          _route.component = myComponent;
          _route.children.map((r: any) => menusData.push(r))
          delete _route.children
        } else {
          _route.component = BlankLayoutPage
        }
      }
    } else {
      _route.component = route.component || resolveComponent(route.code) || BlankLayoutPage;
    }
    menusData.push(_route)
    silderMenus.push(silder)
  })
  return {
    menusData,
    silderMenus
  }
}