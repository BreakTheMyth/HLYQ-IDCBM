import React from 'react'
import { createRoot } from 'react-dom/client'
import * as antd from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { createInstallerApp } from './App'
import './styles.css'

const root = document.getElementById('root')
if (!root) throw new Error('安装器根节点不存在')

const InstallerApp = createInstallerApp(antd, zhCN)
createRoot(root).render(
  <React.StrictMode>
    <InstallerApp />
  </React.StrictMode>,
)
