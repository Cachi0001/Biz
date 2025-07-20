import React from 'react';
import { Card, CardContent } from '../ui/card';
import { CheckCircle } from 'lucide-react';

const SafeSmartUpgradeSystem = () => (
  <Card className="border-green-200 bg-green-50">
    <CardContent className="p-4 text-center">
      <CheckCircle className="h-8 w-8 text-green-600 mx-auto mb-2" />
      <p className="text-green-800 font-medium">You're all set!</p>
      <p className="text-sm text-green-700">
        Your current plan meets your usage needs.
      </p>
    </CardContent>
  </Card>
);

export default SafeSmartUpgradeSystem;