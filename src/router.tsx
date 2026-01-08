import { createBrowserRouter } from 'react-router'

import HomeLayout from './HomeLayout'
import Home from './Home'
import NewLog from './NewLog'
import NewEvent from './NewEvent'

const router = createBrowserRouter([
  {
    Component: HomeLayout,
    children: [
      {
        index: true,
        Component: Home
      },
      {
        path: 'new',
        Component: NewLog
      },
      {
        path: 'new_event',
        Component: NewEvent
      }
    ]
  },
  {
    path: '/ping',
    index: true,
    element: <div>Pong!</div>
  }
])

export default router
