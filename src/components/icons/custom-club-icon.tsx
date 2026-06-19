export function CustomClubIcon({ className, alt, src, style, ...props }: any) {
  return (
    <div 
      className={className} 
      style={{ 
        backgroundColor: 'currentColor',
        WebkitMaskImage: 'url("/club-icon.ico")',
        WebkitMaskSize: 'contain',
        WebkitMaskRepeat: 'no-repeat',
        WebkitMaskPosition: 'center',
        maskImage: 'url("/club-icon.ico")',
        maskSize: 'contain',
        maskRepeat: 'no-repeat',
        maskPosition: 'center',
        transform: 'scale(1.7)',
        ...style
      }}
      role="img"
      aria-label="Club Icon"
      {...props} 
    />
  )
}
