import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TabsContent } from '@/components/ui/tabs';

const cardClass = 'backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl';

export function FinancialTab() {
  return (
    <TabsContent value="financial" className="space-y-6">
      <Card className={cardClass}>
        <CardHeader>
          <CardTitle>Financial Information</CardTitle>
          <CardDescription>Banking and payment details</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No financial information available</p>
        </CardContent>
      </Card>
    </TabsContent>
  );
}
