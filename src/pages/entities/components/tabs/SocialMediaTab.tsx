import { Plus, User, Hash, Pencil, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TabsContent } from '@/components/ui/tabs';

interface SocialMediaTabProps {
  hasCreativeRole: boolean;
  socialMediaAccounts: any[];
  onAddSocialMedia: () => void;
  onEditSocialMedia: (account: any) => void;
  onDeleteSocialMedia: (accountId: number) => void;
}

const cardClass = 'backdrop-blur-xl bg-white/60 dark:bg-slate-900/60 border-white/20 dark:border-white/10 shadow-xl rounded-2xl';

export function SocialMediaTab({
  hasCreativeRole,
  socialMediaAccounts,
  onAddSocialMedia,
  onEditSocialMedia,
  onDeleteSocialMedia,
}: SocialMediaTabProps) {
  if (!hasCreativeRole) {
    return null;
  }

  return (
    <TabsContent value="social" className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-medium">Social Media Accounts</h3>
          <p className="text-sm text-muted-foreground">Manage social media profiles and links</p>
        </div>
        <Button onClick={onAddSocialMedia}>
          <Plus className="h-4 w-4 mr-2" />
          Add Account
        </Button>
      </div>

      {socialMediaAccounts && socialMediaAccounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {socialMediaAccounts.map((account) => (
            <Card key={account.id} className={`hover:shadow-lg transition-shadow ${cardClass}`}>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{account.platform_icon}</span>
                    <CardTitle className="text-lg">{account.platform_display}</CardTitle>
                  </div>
                  {account.is_verified && (
                    <Badge variant="default" className="bg-blue-500">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Verified
                    </Badge>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {account.display_name && (
                  <div>
                    <p className="text-sm font-medium">{account.display_name}</p>
                  </div>
                )}
                {account.handle && (
                  <div>
                    <p className="text-sm text-muted-foreground">@{account.handle}</p>
                  </div>
                )}
                {account.follower_count && (
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <p className="text-sm font-medium">{account.follower_count.toLocaleString()} followers</p>
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1" asChild>
                    <a href={account.url} target="_blank" rel="noopener noreferrer">
                      Visit Profile
                      <svg className="w-3 h-3 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </a>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onEditSocialMedia(account)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDeleteSocialMedia(account.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className={cardClass}>
          <CardContent className="py-12">
            <div className="text-center space-y-3">
              <div className="mx-auto w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                <Hash className="h-6 w-6 text-muted-foreground" />
              </div>
              <div>
                <p className="text-lg font-medium">No social media accounts yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add social media accounts to showcase your online presence
                </p>
              </div>
              <Button onClick={onAddSocialMedia} variant="outline">
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Account
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </TabsContent>
  );
}
