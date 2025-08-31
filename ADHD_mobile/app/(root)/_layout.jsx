import { useUser } from "@clerk/clerk-expo";
import { Redirect } from 'expo-router';
import { Stack } from 'expo-router/stack';

export default function Layout() {
  const { isSignedIn, isLoaded } = useUser();

  if (!isLoaded) return null;  //this is for a better user experience: 
                              // doesn't show welcome page if already signed in and loading

  if (!isSignedIn) {
    return <Redirect href={'/sign-in'} />;
  }

  return <Stack screenOptions={{ headerShown: false}}/>;
}