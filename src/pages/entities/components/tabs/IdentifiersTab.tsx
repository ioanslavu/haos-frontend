import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';
import { format } from 'date-fns';

interface IdentifiersTabProps {
  identifiers: any[];
}

const cardClass = 'backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl';

export function IdentifiersTab({ identifiers }: IdentifiersTabProps) {
  return (
    <TabsContent value="identifiers" className="space-y-6">
      <Card className={cardClass}>
        <CardHeader>
          <CardTitle>Identification Codes</CardTitle>
          <CardDescription>Tracking identifiers for this entity</CardDescription>
        </CardHeader>
        <CardContent>
          {identifiers && identifiers.length > 0 ? (
            <div className="space-y-4">
              {identifiers.map((identifier: any) => (
                <div key={identifier.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">{identifier.scheme}</p>
                    <p className="text-sm text-muted-foreground">{identifier.value}</p>
                  </div>
                  {identifier.expiry_date && (
                    <Badge variant={new Date(identifier.expiry_date) < new Date() ? 'destructive' : 'default'}>
                      Expires: {format(new Date(identifier.expiry_date), 'PP')}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground">No identifiers found</p>
          )}
        </CardContent>
      </Card>
    </TabsContent>
  );
}
