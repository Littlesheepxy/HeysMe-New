'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Share2, 
  Users, 
  BookTemplate, 
  Link, 
  AlertTriangle, 
  Shield,
  Sparkles,
  Check
} from 'lucide-react';

interface ShareDialogProps {
  children: React.ReactNode;
  pageId?: string;
  pageTitle?: string;
  pageContent?: any;
  onShare?: (shareData: ShareData) => Promise<void>;
}

interface ShareData {
  type: 'plaza' | 'template' | 'link';
  config: any;
}

interface PlazaShareConfig {
  title: string;
  description: string;
  category: string;
  tags: string[];
  industryTags: string[];
  location?: string;
  privacySettings: {
    allowView: boolean;
    allowFavorite: boolean;
    showUsername: boolean;
  };
}

interface TemplateShareConfig {
  title: string;
  description: string;
  category: string;
  tags: string[];
  designTags: string[];
  includePromptHistory: boolean;
}

const categories = [
  '求职', '招聘', '寻找合作', '寻找投资人/投资机会', '托管/运营服务',
  '咨询服务', '个人展示/KOL', '内容创作者/自媒体', '教育辅导', '自由职业/开发者', '其他'
];

const templateCategories = [
  '简历页', '招聘页', '咨询介绍页', '作品集展示页', '导师推荐页',
  '品牌故事页', '内容创作页', '其他用途'
];

const industryTags = [
  'AI', '产品设计', 'SaaS', '前端', '后端', 'React', 'Vue', 'Node.js',
  '设计', '编程', '咨询', '教育', '健康', '营销', '创业', '技术'
];

const designTags = [
  '简约商务', '深色主题', '科技感', '渐变色', '温馨', '卡片式',
  '现代', '经典', '创意', '专业', '活泼', '优雅'
];

export function ShareDialog({ children, pageId, pageTitle = '', pageContent, onShare }: ShareDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('plaza');

  // 数字身份广场分享配置
  const [plazaConfig, setPlazaConfig] = useState<PlazaShareConfig>({
    title: pageTitle,
    description: '',
    category: '求职',
    tags: [],
    industryTags: [],
    location: '',
    privacySettings: {
      allowView: true,
      allowFavorite: true,
      showUsername: false
    }
  });

  // 模板库分享配置
  const [templateConfig, setTemplateConfig] = useState<TemplateShareConfig>({
    title: pageTitle + ' - 模板',
    description: '',
    category: '简历页',
    tags: [],
    designTags: [],
    includePromptHistory: true
  });

  const handleShare = async (type: 'plaza' | 'template' | 'link') => {
    if (!onShare) return;

    setIsLoading(true);
    try {
      let config: any;
      
      switch (type) {
        case 'plaza':
          config = plazaConfig;
          break;
        case 'template':
          config = templateConfig;
          break;
        case 'link':
          config = { generatePrivateLink: true };
          break;
      }

      await onShare({ type, config });
      setIsOpen(false);
    } catch (error) {
      console.error('分享失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const addTag = (tag: string, type: 'tags' | 'industryTags' | 'designTags', configType: 'plaza' | 'template') => {
    if (configType === 'plaza' && (type === 'tags' || type === 'industryTags')) {
      setPlazaConfig(prev => ({
        ...prev,
        [type]: [...prev[type], tag]
      }));
    } else if (configType === 'template' && (type === 'tags' || type === 'designTags')) {
      setTemplateConfig(prev => ({
        ...prev,
        [type]: [...prev[type], tag]
      }));
    }
  };

  const removeTag = (tag: string, type: 'tags' | 'industryTags' | 'designTags', configType: 'plaza' | 'template') => {
    if (configType === 'plaza' && (type === 'tags' || type === 'industryTags')) {
      setPlazaConfig(prev => ({
        ...prev,
        [type]: prev[type].filter(t => t !== tag)
      }));
    } else if (configType === 'template' && (type === 'tags' || type === 'designTags')) {
      setTemplateConfig(prev => ({
        ...prev,
        [type]: prev[type].filter(t => t !== tag)
      }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5" />
            分享页面
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="plaza" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              数字身份广场
            </TabsTrigger>
            <TabsTrigger value="template" className="flex items-center gap-2">
              <BookTemplate className="w-4 h-4" />
              灵感模板库
            </TabsTrigger>
            <TabsTrigger value="link" className="flex items-center gap-2">
              <Link className="w-4 h-4" />
              私密链接
            </TabsTrigger>
          </TabsList>

          {/* 数字身份广场分享 */}
          <TabsContent value="plaza" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  分享到数字身份广场
                </CardTitle>
                <CardDescription>
                  让其他人发现你的身份页面，建立有价值的连接
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="plaza-title">页面标题</Label>
                    <Input
                      id="plaza-title"
                      value={plazaConfig.title}
                      onChange={(e) => setPlazaConfig(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="资深产品经理寻找远程机会"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="plaza-category">目标分类</Label>
                    <select
                      id="plaza-category"
                      value={plazaConfig.category}
                      onChange={(e) => setPlazaConfig(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    >
                      {categories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plaza-description">一句话简介</Label>
                  <Textarea
                    id="plaza-description"
                    value={plazaConfig.description}
                    onChange={(e) => setPlazaConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="8年B端产品经验，擅长AI产品设计"
                    maxLength={60}
                  />
                  <div className="text-xs text-muted-foreground text-right">
                    {plazaConfig.description.length}/60
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>行业标签</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {plazaConfig.industryTags.map(tag => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag, 'industryTags', 'plaza')}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {industryTags.filter(tag => !plazaConfig.industryTags.includes(tag)).map(tag => (
                      <Badge key={tag} variant="outline" className="cursor-pointer" onClick={() => addTag(tag, 'industryTags', 'plaza')}>
                        + {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plaza-location">地区（可选）</Label>
                  <Input
                    id="plaza-location"
                    value={plazaConfig.location}
                    onChange={(e) => setPlazaConfig(prev => ({ ...prev, location: e.target.value }))}
                    placeholder="北京"
                  />
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    隐私设置
                  </Label>
                  
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      <strong>隐私提醒：</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• 真实姓名将被隐藏</li>
                        <li>• 联系方式不会显示</li>
                        <li>• 公司名称将模糊化处理</li>
                      </ul>
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-3">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allow-view"
                        checked={plazaConfig.privacySettings.allowView}
                        onCheckedChange={(checked) => 
                          setPlazaConfig(prev => ({
                            ...prev,
                            privacySettings: { ...prev.privacySettings, allowView: !!checked }
                          }))
                        }
                      />
                      <Label htmlFor="allow-view">允许他人查看我的页面</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="allow-favorite"
                        checked={plazaConfig.privacySettings.allowFavorite}
                        onCheckedChange={(checked) => 
                          setPlazaConfig(prev => ({
                            ...prev,
                            privacySettings: { ...prev.privacySettings, allowFavorite: !!checked }
                          }))
                        }
                      />
                      <Label htmlFor="allow-favorite">允许他人收藏我的页面</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="show-username"
                        checked={plazaConfig.privacySettings.showUsername}
                        onCheckedChange={(checked) => 
                          setPlazaConfig(prev => ({
                            ...prev,
                            privacySettings: { ...prev.privacySettings, showUsername: !!checked }
                          }))
                        }
                      />
                      <Label htmlFor="show-username">显示我的用户名</Label>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => handleShare('plaza')} disabled={isLoading} className="flex-1">
                    {isLoading ? '分享中...' : '确认分享到广场'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    取消
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 灵感模板库分享 */}
          <TabsContent value="template" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookTemplate className="w-5 h-5" />
                  分享到灵感模板库
                </CardTitle>
                <CardDescription>
                  将你的页面作为模板分享，帮助其他用户快速创建
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="template-title">模板标题</Label>
                    <Input
                      id="template-title"
                      value={templateConfig.title}
                      onChange={(e) => setTemplateConfig(prev => ({ ...prev, title: e.target.value }))}
                      placeholder="高级产品经理简历页"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="template-category">模板分类</Label>
                    <select
                      id="template-category"
                      value={templateConfig.category}
                      onChange={(e) => setTemplateConfig(prev => ({ ...prev, category: e.target.value }))}
                      className="w-full p-2 border rounded-md"
                    >
                      {templateCategories.map(cat => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="template-description">适用场景</Label>
                  <Textarea
                    id="template-description"
                    value={templateConfig.description}
                    onChange={(e) => setTemplateConfig(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="适用于年薪30w+的职场精英"
                  />
                </div>

                <div className="space-y-2">
                  <Label>设计风格标签</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {templateConfig.designTags.map(tag => (
                      <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag, 'designTags', 'template')}>
                        {tag} ×
                      </Badge>
                    ))}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {designTags.filter(tag => !templateConfig.designTags.includes(tag)).map(tag => (
                      <Badge key={tag} variant="outline" className="cursor-pointer" onClick={() => addTag(tag, 'designTags', 'template')}>
                        + {tag}
                      </Badge>
                    ))}
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    包含内容
                  </Label>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm">页面设计和布局</span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="include-prompt"
                          checked={templateConfig.includePromptHistory}
                          onCheckedChange={(checked) => 
                            setTemplateConfig(prev => ({ ...prev, includePromptHistory: !!checked }))
                          }
                        />
                        <Label htmlFor="include-prompt">对话记录（已脱敏）</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Check className="w-4 h-4 text-green-500" />
                        <span className="text-sm">Prompt模板</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                        <span className="text-sm text-muted-foreground">个人信息（将被完全移除）</span>
                      </div>
                    </div>
                  </div>

                  <Alert>
                    <Sparkles className="h-4 w-4" />
                    <AlertDescription>
                      <strong>预期效果：</strong>
                      <ul className="mt-2 space-y-1 text-sm">
                        <li>• 其他用户可以Fork此模板</li>
                        <li>• 您将获得创作者署名</li>
                        <li>• 模板使用数据将统计到您的贡献</li>
                      </ul>
                    </AlertDescription>
                  </Alert>
                </div>

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => handleShare('template')} disabled={isLoading} className="flex-1">
                    {isLoading ? '分享中...' : '确认分享到模板库'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    取消
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* 私密链接分享 */}
          <TabsContent value="link" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Link className="w-5 h-5" />
                  生成私密分享链接
                </CardTitle>
                <CardDescription>
                  生成一个专属链接，只有拥有链接的人才能查看
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Alert>
                  <Shield className="h-4 w-4" />
                  <AlertDescription>
                    私密链接将包含完整的页面内容，包括所有个人信息。请谨慎分享给信任的人。
                  </AlertDescription>
                </Alert>

                <div className="flex gap-2 pt-4">
                  <Button onClick={() => handleShare('link')} disabled={isLoading} className="flex-1">
                    {isLoading ? '生成中...' : '生成私密链接'}
                  </Button>
                  <Button variant="outline" onClick={() => setIsOpen(false)}>
                    取消
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
} 