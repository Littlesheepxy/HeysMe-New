"use client"

import React, { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { UnsplashImage } from '@/lib/services/unsplash'

interface SmartImageProps {
  src?: string
  unsplashImage?: UnsplashImage
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  quality?: number
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down'
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  // 动画相关
  animate?: boolean
  animationDelay?: number
  // 优化选项
  optimizationOptions?: {
    width?: number
    height?: number
    quality?: number
    format?: 'jpg' | 'png' | 'webp'
  }
  // 回调函数
  onLoad?: () => void
  onError?: () => void
}

/**
 * 智能图片组件
 * 支持 Unsplash 图片优化、懒加载、动画效果
 */
export function SmartImage({
  src,
  unsplashImage,
  alt,
  width = 800,
  height = 600,
  className,
  priority = false,
  quality = 80,
  objectFit = 'cover',
  placeholder = 'blur',
  blurDataURL,
  sizes,
  animate = true,
  animationDelay = 0,
  optimizationOptions,
  onLoad,
  onError
}: SmartImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [imageSrc, setImageSrc] = useState<string>('')

  useEffect(() => {
    if (unsplashImage) {
      // 使用 Unsplash 图片并应用优化
      const optimizedUrl = getOptimizedUnsplashUrl(unsplashImage, {
        width: optimizationOptions?.width || width,
        height: optimizationOptions?.height || height,
        quality: optimizationOptions?.quality || quality,
        format: optimizationOptions?.format || 'webp'
      })
      setImageSrc(optimizedUrl)
    } else if (src) {
      setImageSrc(src)
    }
  }, [src, unsplashImage, width, height, quality, optimizationOptions])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setImageError(true)
    onError?.()
    // 设置备用图片
    setImageSrc('/placeholder.jpg')
  }

  // 生成模糊占位符
  const generateBlurDataURL = () => {
    if (blurDataURL) return blurDataURL
    
    // 生成简单的渐变作为占位符
    return `data:image/svg+xml;base64,${Buffer.from(
      `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#10B981;stop-opacity:0.1" />
            <stop offset="100%" style="stop-color:#06B6D4;stop-opacity:0.1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#g)" />
      </svg>`
    ).toString('base64')}`
  }

  const imageComponent = (
    <div className={cn('relative overflow-hidden', className)}>
      {/* 加载状态指示器 */}
      {!isLoaded && !imageError && (
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-cyan-50 animate-pulse" />
      )}
      
      {/* 主图片 */}
      <Image
        src={imageSrc || '/placeholder.jpg'}
        alt={alt}
        width={width}
        height={height}
        priority={priority}
        quality={quality}
        className={cn(
          'transition-opacity duration-500',
          isLoaded ? 'opacity-100' : 'opacity-0',
          objectFit === 'cover' && 'object-cover',
          objectFit === 'contain' && 'object-contain',
          objectFit === 'fill' && 'object-fill',
          objectFit === 'none' && 'object-none',
          objectFit === 'scale-down' && 'object-scale-down'
        )}
        placeholder={placeholder}
        blurDataURL={generateBlurDataURL()}
        sizes={sizes}
        onLoad={handleLoad}
        onError={handleError}
      />

      {/* 品牌色叠加层（可选） */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 via-transparent to-cyan-500/10 pointer-events-none" />
    </div>
  )

  // 如果启用动画，包装动画组件
  if (animate) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{
          duration: 0.6,
          delay: animationDelay,
          ease: [0.22, 1, 0.36, 1]
        }}
        className="h-full w-full"
      >
        {imageComponent}
      </motion.div>
    )
  }

  return imageComponent
}

/**
 * 获取优化的 Unsplash 图片 URL
 */
function getOptimizedUnsplashUrl(
  image: UnsplashImage,
  options: {
    width?: number
    height?: number
    quality?: number
    format?: 'jpg' | 'png' | 'webp'
  } = {}
): string {
  const { width = 800, height = 600, quality = 80, format = 'webp' } = options
  
  const params = new URLSearchParams({
    w: width.toString(),
    h: height.toString(),
    q: quality.toString(),
    fm: format,
    fit: 'crop',
    crop: 'center'
  })

  return `${image.urls.raw}&${params}`
}

/**
 * 图片网格组件
 */
interface ImageGridProps {
  images: UnsplashImage[]
  columns?: number
  gap?: string
  className?: string
  imageClassName?: string
  animate?: boolean
}

export function ImageGrid({
  images,
  columns = 3,
  gap = 'gap-4',
  className,
  imageClassName,
  animate = true
}: ImageGridProps) {
  return (
    <div className={cn(
      'grid',
      columns === 2 && 'grid-cols-2',
      columns === 3 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
      columns === 4 && 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
      gap,
      className
    )}>
      {images.map((image, index) => (
        <SmartImage
          key={image.id}
          unsplashImage={image}
          alt={image.alt_description || image.description || `Image ${index + 1}`}
          className={cn('rounded-xl shadow-lg', imageClassName)}
          animate={animate}
          animationDelay={index * 0.1}
        />
      ))}
    </div>
  )
}

/**
 * 头像组件
 */
interface AvatarImageProps {
  unsplashImage?: UnsplashImage
  src?: string
  alt: string
  size?: number
  className?: string
  animate?: boolean
  animationDelay?: number
}

export function AvatarImage({
  unsplashImage,
  src,
  alt,
  size = 64,
  className,
  animate = true,
  animationDelay = 0
}: AvatarImageProps) {
  return (
    <SmartImage
      unsplashImage={unsplashImage}
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={cn('rounded-full', className)}
      animate={animate}
      animationDelay={animationDelay}
      optimizationOptions={{
        width: size,
        height: size,
        quality: 90,
        format: 'webp'
      }}
      objectFit="cover"
    />
  )
}

/**
 * Hero 背景图片组件
 */
interface HeroBackgroundProps {
  unsplashImage?: UnsplashImage
  src?: string
  alt: string
  className?: string
  overlay?: boolean
  overlayOpacity?: number
}

export function HeroBackground({
  unsplashImage,
  src,
  alt,
  className,
  overlay = true,
  overlayOpacity = 0.3
}: HeroBackgroundProps) {
  return (
    <div className={cn('relative w-full h-full', className)}>
      <SmartImage
        unsplashImage={unsplashImage}
        src={src}
        alt={alt}
        width={1920}
        height={1080}
        className="w-full h-full"
        priority={true}
        objectFit="cover"
        animate={false}
        optimizationOptions={{
          width: 1920,
          height: 1080,
          quality: 85,
          format: 'webp'
        }}
      />
      
      {overlay && (
        <div 
          className="absolute inset-0 bg-gradient-to-br from-emerald-900/30 via-transparent to-cyan-900/30"
          style={{ opacity: overlayOpacity }}
        />
      )}
    </div>
  )
}
