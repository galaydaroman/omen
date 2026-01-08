import { Outlet } from 'react-router'
import './HomeLayout.css'

export default function HomeLayout() {
  return <>
    <div className="header">
      <div className="logo">OMEN</div>
    </div>
    <div className="main">
      <Outlet />
    </div>
  </>
}
