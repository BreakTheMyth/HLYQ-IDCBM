import { Button, Card, Flex, Tag, Typography } from 'antd'

function App() {
  return (
    <main className="app-placeholder">
      <Card className="app-placeholder__card" title="皓量云擎业务管理系统 - 会员控制台">
        <Flex vertical gap={16} align="flex-start">
          <Tag color="processing">React 19 + Ant Design 6</Tag>
          <Typography.Text type="secondary">
            会员控制台前端基础工程已初始化，主题配置已生效。
          </Typography.Text>
          <Button type="primary">主题色预览</Button>
        </Flex>
      </Card>
    </main>
  )
}

export default App
