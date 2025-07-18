import React from 'react';
import { Button } from './button';
import { Input } from './input';
import { Label } from './label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Card, CardContent, CardHeader, CardTitle } from './card';

/**
 * Test component to verify mobile-first responsive design improvements
 * This component demonstrates the enhanced touch accessibility features:
 * - Input fields with minimum 48px height
 * - Buttons with minimum 44px touch targets
 * - Full-width buttons on mobile
 * - Proper spacing and typography scaling
 */
const MobileResponsiveTest = () => {
  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Mobile-First Responsive Design Test</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Form Fields Test */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Form Fields (48px minimum height)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Text Input</Label>
                <Input 
                  placeholder="Test input field"
                  className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-medium">Select Dropdown</Label>
                <Select>
                  <SelectTrigger className="h-12 min-h-[48px] text-base sm:text-sm touch-manipulation">
                    <SelectValue placeholder="Select an option" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="option1">Option 1</SelectItem>
                    <SelectItem value="option2">Option 2</SelectItem>
                    <SelectItem value="option3">Option 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Button Tests */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Buttons (44px minimum touch targets)</h3>
            
            {/* Mobile-first button layout */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-2">
              <Button className="w-full sm:w-auto min-h-[44px] touch-manipulation">
                Primary Button
              </Button>
              <Button 
                variant="outline" 
                className="w-full sm:w-auto min-h-[44px] touch-manipulation"
              >
                Secondary Button
              </Button>
              <Button 
                variant="ghost" 
                className="w-full sm:w-auto min-h-[44px] touch-manipulation"
              >
                Ghost Button
              </Button>
            </div>
          </div>

          {/* Grid Layout Test */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Responsive Grid Layout</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4 border-2 border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">1</div>
                  <div className="text-sm text-gray-600">Single column on mobile</div>
                </div>
              </Card>
              <Card className="p-4 border-2 border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">2</div>
                  <div className="text-sm text-gray-600">Two columns on small screens</div>
                </div>
              </Card>
              <Card className="p-4 border-2 border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">3</div>
                  <div className="text-sm text-gray-600">Four columns on medium+</div>
                </div>
              </Card>
              <Card className="p-4 border-2 border-gray-100">
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">4</div>
                  <div className="text-sm text-gray-600">Responsive behavior</div>
                </div>
              </Card>
            </div>
          </div>

          {/* Touch Target Test */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Touch Target Test (44px minimum)</h3>
            <div className="grid grid-cols-3 gap-2">
              <Button 
                variant="ghost" 
                className="min-h-[44px] flex flex-col items-center justify-center p-2 touch-manipulation hover:bg-blue-50"
              >
                <div className="h-5 w-5 bg-blue-600 rounded mb-1"></div>
                <span className="text-xs text-blue-600 font-medium">Action 1</span>
              </Button>
              <Button 
                variant="ghost" 
                className="min-h-[44px] flex flex-col items-center justify-center p-2 touch-manipulation hover:bg-green-50"
              >
                <div className="h-5 w-5 bg-green-600 rounded mb-1"></div>
                <span className="text-xs text-green-600 font-medium">Action 2</span>
              </Button>
              <Button 
                variant="ghost" 
                className="min-h-[44px] flex flex-col items-center justify-center p-2 touch-manipulation hover:bg-purple-50"
              >
                <div className="h-5 w-5 bg-purple-600 rounded mb-1"></div>
                <span className="text-xs text-purple-600 font-medium">Action 3</span>
              </Button>
            </div>
          </div>

          {/* Responsive Typography Test */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Responsive Typography</h3>
            <div className="space-y-2">
              <p className="text-base sm:text-sm">
                This text scales from base (16px) on mobile to sm (14px) on larger screens
              </p>
              <p className="text-lg sm:text-xl font-bold text-green-600">
                This heading scales from lg to xl across breakpoints
              </p>
            </div>
          </div>

          {/* Breakpoint Indicators */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Current Breakpoint Indicator</h3>
            <div className="flex flex-wrap gap-2">
              <div className="px-3 py-2 bg-red-100 text-red-800 rounded block sm:hidden">
                Mobile (< 640px)
              </div>
              <div className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded hidden sm:block md:hidden">
                Small (640px - 768px)
              </div>
              <div className="px-3 py-2 bg-green-100 text-green-800 rounded hidden md:block lg:hidden">
                Medium (768px - 1024px)
              </div>
              <div className="px-3 py-2 bg-blue-100 text-blue-800 rounded hidden lg:block">
                Large (1024px+)
              </div>
            </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
};

export default MobileResponsiveTest;