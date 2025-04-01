export const breakpoints = {
  sm: 640,
  md: 768,
  lg: 1024,
  xl: 1280,
  "2xl": 1536,
}

/**
 * CSS classes that apply only on mobile devices
 * Usage: className={responsiveClasses('base-class', 'mobile-only-class')}
 */
export function responsiveClasses(baseClasses: string, mobileClasses: string, desktopClasses = ""): string {
  return `${baseClasses} ${mobileClasses} md:${desktopClasses || "hidden"}`
}

/**
 * CSS classes that apply only on desktop devices
 * Usage: className={responsiveClasses('base-class', 'desktop-only-class')}
 */
export function desktopClasses(baseClasses: string, desktopClasses: string): string {
  return `${baseClasses} hidden md:${desktopClasses}`
}

/**
 * Responsive utility for conditional rendering based on screen size
 * Usage in Tailwind classes:
 * className="md:border md:shadow md:rounded-lg border-0 shadow-none rounded-none"
 */

