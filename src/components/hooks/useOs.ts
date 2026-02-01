import { useState } from 'react'

type OS = 'windows' | 'mac' | 'ios' | 'android' | 'linux' | 'undetermined'

const MACOS_PLATFORMS = ['Macintosh', 'MacIntel', 'MacPPC', 'Mac68K']
const WINDOWS_PLATFORMS = ['Win32', 'Win64', 'Windows', 'WinCE']
const IOS_PLATFORMS = ['iPhone', 'iPad', 'iPod']
const LINUX_PLATFORM_MATCHER = /Linux/
const IOS_USERAGENT_MATCHER = /iPhone|iPad|iPod/
const ANDROID_USERAGENT_MATCHER = /Android/
const WINDOWS_USERAGENT_MATCHER = /Win/

function getOS(): OS {
  if (typeof window === 'undefined') return 'undetermined'

  const userAgent = window.navigator.userAgent
  const platform = window.navigator.platform

  if (MACOS_PLATFORMS.indexOf(platform) !== -1) {
    return 'mac'
  } else if (IOS_PLATFORMS.indexOf(platform) !== -1 || IOS_USERAGENT_MATCHER.test(userAgent)) {
    return 'ios'
  } else if (WINDOWS_PLATFORMS.indexOf(platform) !== -1 || WINDOWS_USERAGENT_MATCHER.test(userAgent)) {
    return 'windows'
  } else if (ANDROID_USERAGENT_MATCHER.test(userAgent)) {
    return 'android'
  } else if (LINUX_PLATFORM_MATCHER.test(platform)) {
    return 'linux'
  }

  return 'undetermined'
}

export function useOs(): OS {
  const [os] = useState<OS>(getOS)

  return os
}
