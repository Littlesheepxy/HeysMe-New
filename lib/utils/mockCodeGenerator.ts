// 模拟代码生成器 - 用于演示React预览功能

export interface MockCodeFile {
  filename: string;
  content: string;
  language: string;
  type: 'component' | 'page' | 'styles' | 'config' | 'data';
  description?: string;
}

export function generateMockResumeCode(userData: any): MockCodeFile[] {
  const files: MockCodeFile[] = [];

  // 生成主组件文件
  files.push({
    filename: 'Resume.tsx',
    content: generateResumeComponent(userData),
    language: 'typescript',
    type: 'component',
    description: '主简历组件'
  });

  // 生成样式文件
  files.push({
    filename: 'styles.css',
    content: generateStylesCSS(),
    language: 'css',
    type: 'styles',
    description: '样式文件'
  });

  // 生成数据文件
  files.push({
    filename: 'userData.ts',
    content: generateUserData(userData),
    language: 'typescript',
    type: 'data',
    description: '用户数据'
  });

  // 生成配置文件
  files.push({
    filename: 'package.json',
    content: generatePackageJson(),
    language: 'json',
    type: 'config',
    description: '项目配置'
  });

  return files;
}

function generateResumeComponent(userData: any): string {
  return `import React from 'react';
import './styles.css';

interface Project {
  title: string;
  description: string;
  technologies: string[];
  liveUrl?: string;
  githubUrl?: string;
  iframe?: string;
  image?: string;
}

interface UserData {
  name: string;
  title: string;
  bio: string;
  avatar: string;
  email: string;
  linkedin?: string;
  github?: string;
  projects: Project[];
}

const userData: UserData = {
  name: "${userData.name || '张三'}",
  title: "${userData.title || '前端开发工程师'}",
  bio: "${userData.bio || '热爱技术，专注于前端开发和用户体验设计'}",
  avatar: "${userData.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}",
  email: "${userData.email || 'zhangsan@example.com'}",
  linkedin: "${userData.linkedin || 'https://linkedin.com/in/zhangsan'}",
  github: "${userData.github || 'https://github.com/zhangsan'}",
  projects: [
    {
      title: "个人作品集网站",
      description: "使用React和TypeScript构建的响应式个人作品集",
      technologies: ["React", "TypeScript", "Tailwind CSS"],
      liveUrl: "https://portfolio.example.com",
      githubUrl: "https://github.com/zhangsan/portfolio",
      iframe: "https://codesandbox.io/embed/react-portfolio-example",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop"
    },
    {
      title: "任务管理应用",
      description: "全栈任务管理应用，支持实时协作",
      technologies: ["React", "Node.js", "MongoDB"],
      liveUrl: "https://taskapp.example.com", 
      githubUrl: "https://github.com/zhangsan/taskapp",
      image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=250&fit=crop"
    },
    {
      title: "在线代码编辑器",
      description: "基于Web的代码编辑器，支持多语言语法高亮",
      technologies: ["Vue.js", "Monaco Editor", "WebAssembly"],
      iframe: "https://codesandbox.io/embed/online-code-editor",
      githubUrl: "https://github.com/zhangsan/code-editor",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop"
    }
  ]
};

function App() {
  return (
    <div className="resume-container">
      <PersonalProfile data={userData} />
      <ProjectShowcase data={userData} />
      <ContactSection data={userData} />
    </div>
  );
}

function PersonalProfile({ data }: { data: UserData }) {
  return (
    <section className="personal-profile">
      <div className="profile-card">
        <img 
          src={data.avatar} 
          alt="Profile" 
          className="profile-avatar"
        />
        <h1 className="profile-name">{data.name}</h1>
        <p className="profile-title">{data.title}</p>
        <p className="profile-bio">{data.bio}</p>
      </div>
    </section>
  );
}

function ProjectShowcase({ data }: { data: UserData }) {
  return (
    <section className="projects-section">
      <h2 className="section-title">作品展示</h2>
      <div className="projects-grid">
        {data.projects.map((project, index) => (
          <ProjectCard key={index} project={project} />
        ))}
      </div>
    </section>
  );
}

function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="project-card">
      {project.iframe ? (
        <div className="project-iframe-container">
          <iframe
            src={project.iframe}
            className="project-iframe"
            title={project.title}
            loading="lazy"
          />
        </div>
      ) : (
        <img 
          src={project.image} 
          alt={project.title}
          className="project-image"
        />
      )}
      
      <div className="project-content">
        <h3 className="project-title">{project.title}</h3>
        <p className="project-description">{project.description}</p>
        
        <div className="project-technologies">
          {project.technologies.map((tech, i) => (
            <span key={i} className="tech-tag">{tech}</span>
          ))}
        </div>
        
        <div className="project-links">
          {project.liveUrl && (
            <a href={project.liveUrl} className="project-link project-link--primary">
              查看项目
            </a>
          )}
          {project.githubUrl && (
            <a href={project.githubUrl} className="project-link project-link--secondary">
              源代码
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

function ContactSection({ data }: { data: UserData }) {
  return (
    <section className="contact-section">
      <h2 className="section-title">联系我</h2>
      <div className="contact-links">
        <a href={\`mailto:\${data.email}\`} className="contact-link contact-link--email">
          邮箱联系
        </a>
        {data.linkedin && (
          <a href={data.linkedin} className="contact-link contact-link--linkedin">
            LinkedIn
          </a>
        )}
        {data.github && (
          <a href={data.github} className="contact-link contact-link--github">
            GitHub
          </a>
        )}
      </div>
    </section>
  );
}

export default App;`;
}

function generateStylesCSS(): string {
  return `.resume-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
}

/* Personal Profile */
.personal-profile {
  margin-bottom: 3rem;
}

.profile-card {
  background: white;
  border-radius: 1rem;
  padding: 3rem 2rem;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transform: translateY(0);
  transition: transform 0.3s ease;
}

.profile-card:hover {
  transform: translateY(-5px);
}

.profile-avatar {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  margin: 0 auto 1.5rem;
  border: 4px solid #667eea;
}

.profile-name {
  font-size: 2.5rem;
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.profile-title {
  font-size: 1.25rem;
  color: #667eea;
  margin-bottom: 1rem;
  font-weight: 600;
}

.profile-bio {
  color: #4a5568;
  line-height: 1.6;
  max-width: 600px;
  margin: 0 auto;
}

/* Projects Section */
.projects-section {
  margin-bottom: 3rem;
}

.section-title {
  font-size: 2rem;
  font-weight: bold;
  color: white;
  text-align: center;
  margin-bottom: 2rem;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 2rem;
}

.project-card {
  background: white;
  border-radius: 1rem;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

.project-card:hover {
  transform: translateY(-5px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.15);
}

.project-iframe-container {
  height: 250px;
  position: relative;
  overflow: hidden;
}

.project-iframe {
  width: 100%;
  height: 100%;
  border: none;
  transition: opacity 0.3s ease;
}

.project-image {
  width: 100%;
  height: 250px;
  object-fit: cover;
}

.project-content {
  padding: 1.5rem;
}

.project-title {
  font-size: 1.25rem;
  font-weight: bold;
  color: #2d3748;
  margin-bottom: 0.5rem;
}

.project-description {
  color: #4a5568;
  margin-bottom: 1rem;
  line-height: 1.5;
}

.project-technologies {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.tech-tag {
  background: #e2e8f0;
  color: #2d3748;
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.875rem;
  font-weight: 500;
}

.project-links {
  display: flex;
  gap: 0.75rem;
}

.project-link {
  padding: 0.5rem 1rem;
  border-radius: 0.5rem;
  text-decoration: none;
  font-weight: 500;
  transition: all 0.3s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.project-link--primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.project-link--secondary {
  background: #2d3748;
  color: white;
}

.project-link:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

/* Contact Section */
.contact-section {
  text-align: center;
}

.contact-links {
  display: flex;
  justify-content: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.contact-link {
  padding: 0.75rem 1.5rem;
  border-radius: 0.75rem;
  text-decoration: none;
  font-weight: 600;
  transition: all 0.3s ease;
  color: white;
}

.contact-link--email {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.contact-link--linkedin {
  background: #0077b5;
}

.contact-link--github {
  background: #333;
}

.contact-link:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
}

/* Responsive Design */
@media (max-width: 768px) {
  .resume-container {
    padding: 1rem;
  }
  
  .profile-name {
    font-size: 2rem;
  }
  
  .projects-grid {
    grid-template-columns: 1fr;
  }
  
  .contact-links {
    flex-direction: column;
    align-items: center;
  }
}`;
}

function generateUserData(userData: any): string {
  return `export const userData = {
  name: "${userData.name || '张三'}",
  title: "${userData.title || '前端开发工程师'}",
  bio: "${userData.bio || '热爱技术，专注于前端开发和用户体验设计'}",
  avatar: "${userData.avatar || 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face'}",
  email: "${userData.email || 'zhangsan@example.com'}",
  linkedin: "${userData.linkedin || 'https://linkedin.com/in/zhangsan'}",
  github: "${userData.github || 'https://github.com/zhangsan'}",
  projects: [
    {
      title: "个人作品集网站",
      description: "使用React和TypeScript构建的响应式个人作品集",
      technologies: ["React", "TypeScript", "Tailwind CSS"],
      liveUrl: "https://portfolio.example.com",
      githubUrl: "https://github.com/zhangsan/portfolio",
      iframe: "https://codesandbox.io/embed/react-portfolio-example",
      image: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=250&fit=crop"
    },
    {
      title: "任务管理应用",
      description: "全栈任务管理应用，支持实时协作",
      technologies: ["React", "Node.js", "MongoDB"],
      liveUrl: "https://taskapp.example.com",
      githubUrl: "https://github.com/zhangsan/taskapp",
      image: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?w=400&h=250&fit=crop"
    },
    {
      title: "在线代码编辑器", 
      description: "基于Web的代码编辑器，支持多语言语法高亮",
      technologies: ["Vue.js", "Monaco Editor", "WebAssembly"],
      iframe: "https://codesandbox.io/embed/online-code-editor",
      githubUrl: "https://github.com/zhangsan/code-editor",
      image: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=400&h=250&fit=crop"
    }
  ]
};`;
}

function generatePackageJson(): string {
  return `{
  "name": "heysme-portfolio",
  "version": "1.0.0",
  "description": "AI生成的个人简历和作品集",
  "main": "index.js",
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "next": "^14.0.0",
    "typescript": "^5.0.0",
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "tailwindcss": "^3.3.0",
    "framer-motion": "^10.16.0",
    "lucide-react": "^0.292.0"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "eslint": "^8.0.0",
    "eslint-config-next": "^14.0.0"
  },
  "keywords": [
    "portfolio",
    "resume",
    "react",
    "typescript",
    "nextjs"
  ],
  "author": "HeysMe AI",
  "license": "MIT"
}`;
} 