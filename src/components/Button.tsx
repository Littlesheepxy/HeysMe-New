import React from 'react';

interface ButtonProps {
  /** 按钮文本内容 */
  children: React.ReactNode;
  /** 按钮类型 */
  type?: 'primary' | 'secondary' | 'text';
  /** 是否禁用 */
  disabled?: boolean;
  /** 自定义类名 */
  className?: string;
  /** 点击事件处理函数 */
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
}

const Button: React.FC<ButtonProps> = ({
  children,
  type = 'primary',
  disabled = false,
  className = '',
  onClick,
}) => {
  // 基础样式类名
  const baseStyles = 'px-4 py-2 rounded-md font-medium transition-colors duration-200';
  
  // 根据type确定颜色样式
  const typeStyles = {
    primary: 'bg-blue-500 text-white hover:bg-blue-600',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
    text: 'bg-transparent text-gray-600 hover:bg-gray-100'
  }[type];

  // 禁用状态样式
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      className={`${baseStyles} ${typeStyles} ${disabledStyles} ${className}`}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
    </button>
  );
};

export default Button;