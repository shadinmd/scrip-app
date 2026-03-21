import { View, ScrollView, TouchableOpacity } from 'react-native';
import { Text } from '@/components/ui/text';
import { useStore } from '@/lib/store';
import { UserIcon, ChevronRightIcon, MailIcon, CalendarIcon, HashIcon } from 'lucide-react-native';

const ProfileScreen = () => {
  const { user } = useStore();

  const ProfileItem = ({ icon: Icon, label, value, showChevron = false }: any) => (
    <TouchableOpacity
      activeOpacity={0.7}
      className="flex-row items-center justify-between border-b border-border/50 py-4">
      <View className="flex-row items-center gap-4">
        <View className="h-10 w-10 items-center justify-center rounded-full bg-muted">
          <Icon size={20} className="text-muted-foreground" />
        </View>
        <View>
          <Text className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {label}
          </Text>
          <Text className="text-base font-medium">{value}</Text>
        </View>
      </View>
      {showChevron && <ChevronRightIcon size={20} className="text-muted-foreground" />}
    </TouchableOpacity>
  );

  return (
    <ScrollView className="flex-1 bg-background">
      {/* Header Profile Section */}
      <View className="items-center justify-center bg-muted/30 pb-8 pt-12">
        <View className="h-24 w-24 items-center justify-center rounded-full bg-primary shadow-xl">
          <Text className="text-4xl font-bold text-primary-foreground">
            {user?.username?.charAt(0).toUpperCase() || 'U'}
          </Text>
        </View>
        <Text className="mt-4 text-2xl font-bold tracking-tight">{user?.username || 'User'}</Text>
        <Text className="text-muted-foreground">{user?.email}</Text>
      </View>

      {/* Account Settings Section */}
      <View className="px-6 pt-6">
        <Text className="mb-2 text-lg font-bold">Account Information</Text>

        <ProfileItem icon={UserIcon} label="Username" value={user?.username} />
        <ProfileItem icon={MailIcon} label="Email Address" value={user?.email} />
        <ProfileItem icon={HashIcon} label="User ID" value={`#${user?.id}`} />
        <ProfileItem
          icon={CalendarIcon}
          label="Joined On"
          value={
            user?.createdAt
              ? new Date(user.createdAt).toLocaleDateString(undefined, {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : 'N/A'
          }
        />
      </View>

      <View className="px-6 pb-12 pt-10">
        <Text className="mt-6 text-center text-xs text-muted-foreground">Scrip v1.0.0</Text>
      </View>
    </ScrollView>
  );
};

export default ProfileScreen;
