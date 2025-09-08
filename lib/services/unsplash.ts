/**
 * Unsplash API 服务
 * 用于获取高质量的图片资源
 */

// Unsplash API 配置
const UNSPLASH_ACCESS_KEY = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY || 'demo-key';
const UNSPLASH_API_URL = 'https://api.unsplash.com';

// 图片类别配置
export const UNSPLASH_COLLECTIONS = {
  // 科技和AI相关
  technology: {
    query: 'artificial intelligence technology',
    collection: '1065976'
  },
  // 商务和专业人士
  business: {
    query: 'business professional',
    collection: '1053828'
  },
  // 人像头像
  portraits: {
    query: 'professional headshots',
    collection: '1094734'
  },
  // 产品界面
  ui_design: {
    query: 'user interface design',
    collection: '3178572'
  },
  // 团队合作
  teamwork: {
    query: 'team collaboration',
    collection: '1111575'
  }
};

export interface UnsplashImage {
  id: string;
  urls: {
    raw: string;
    full: string;
    regular: string;
    small: string;
    thumb: string;
  };
  alt_description: string | null;
  description: string | null;
  user: {
    name: string;
    username: string;
  };
  width: number;
  height: number;
}

export interface UnsplashResponse {
  results: UnsplashImage[];
  total: number;
  total_pages: number;
}

class UnsplashService {
  private baseURL = UNSPLASH_API_URL;
  private accessKey = UNSPLASH_ACCESS_KEY;

  /**
   * 搜索图片
   */
  async searchPhotos(
    query: string,
    options: {
      page?: number;
      per_page?: number;
      orientation?: 'landscape' | 'portrait' | 'squarish';
      color?: 'black_and_white' | 'black' | 'white' | 'yellow' | 'orange' | 'red' | 'purple' | 'magenta' | 'green' | 'teal' | 'blue';
    } = {}
  ): Promise<UnsplashResponse> {
    const {
      page = 1,
      per_page = 12,
      orientation = 'landscape',
      color
    } = options;

    const params = new URLSearchParams({
      query,
      page: page.toString(),
      per_page: per_page.toString(),
      orientation,
      client_id: this.accessKey
    });

    if (color) {
      params.append('color', color);
    }

    try {
      const response = await fetch(`${this.baseURL}/search/photos?${params}`);
      
      if (!response.ok) {
        throw new Error(`Unsplash API error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error fetching from Unsplash:', error);
      // 返回默认的备用数据
      return this.getFallbackImages();
    }
  }

  /**
   * 获取Hero区域的科技图片
   */
  async getHeroImages(): Promise<UnsplashImage[]> {
    const response = await this.searchPhotos(UNSPLASH_COLLECTIONS.technology.query, {
      per_page: 3,
      orientation: 'landscape'
    });
    return response.results;
  }

  /**
   * 获取用户头像图片
   */
  async getAvatarImages(): Promise<UnsplashImage[]> {
    const response = await this.searchPhotos(UNSPLASH_COLLECTIONS.portraits.query, {
      per_page: 6,
      orientation: 'squarish'
    });
    return response.results;
  }

  /**
   * 获取产品界面展示图
   */
  async getUIDesignImages(): Promise<UnsplashImage[]> {
    const response = await this.searchPhotos(UNSPLASH_COLLECTIONS.ui_design.query, {
      per_page: 4,
      orientation: 'landscape'
    });
    return response.results;
  }

  /**
   * 获取团队合作图片
   */
  async getTeamworkImages(): Promise<UnsplashImage[]> {
    const response = await this.searchPhotos(UNSPLASH_COLLECTIONS.teamwork.query, {
      per_page: 3,
      orientation: 'landscape'
    });
    return response.results;
  }

  /**
   * 获取商务专业图片
   */
  async getBusinessImages(): Promise<UnsplashImage[]> {
    const response = await this.searchPhotos(UNSPLASH_COLLECTIONS.business.query, {
      per_page: 4,
      orientation: 'landscape'
    });
    return response.results;
  }

  /**
   * 备用图片数据（当API不可用时）
   */
  private getFallbackImages(): UnsplashResponse {
    return {
      results: [
        {
          id: 'fallback-1',
          urls: {
            raw: '/placeholder.jpg',
            full: '/placeholder.jpg',
            regular: '/placeholder.jpg',
            small: '/placeholder.jpg',
            thumb: '/placeholder.jpg'
          },
          alt_description: 'Professional technology workspace',
          description: 'Modern workspace with technology',
          user: {
            name: 'HeysMe',
            username: 'heysme'
          },
          width: 1920,
          height: 1080
        }
      ],
      total: 1,
      total_pages: 1
    };
  }

  /**
   * 生成优化的图片URL
   */
  getOptimizedImageUrl(
    image: UnsplashImage,
    options: {
      width?: number;
      height?: number;
      quality?: number;
      format?: 'jpg' | 'png' | 'webp';
    } = {}
  ): string {
    const { width = 800, height = 600, quality = 80, format = 'webp' } = options;
    
    // 构建优化参数
    const params = new URLSearchParams({
      w: width.toString(),
      h: height.toString(),
      q: quality.toString(),
      fm: format,
      fit: 'crop',
      crop: 'center'
    });

    return `${image.urls.raw}&${params}`;
  }
}

// 导出单例实例
export const unsplashService = new UnsplashService();

// 导出钩子函数
export function useUnsplashImages() {
  return {
    getHeroImages: () => unsplashService.getHeroImages(),
    getAvatarImages: () => unsplashService.getAvatarImages(),
    getUIDesignImages: () => unsplashService.getUIDesignImages(),
    getTeamworkImages: () => unsplashService.getTeamworkImages(),
    getBusinessImages: () => unsplashService.getBusinessImages(),
    getOptimizedUrl: (image: UnsplashImage, options?: Parameters<typeof unsplashService.getOptimizedImageUrl>[1]) => 
      unsplashService.getOptimizedImageUrl(image, options)
  };
}
