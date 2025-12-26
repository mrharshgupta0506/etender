export const isUserLoggedIn = () => {
  const userData = localStorage.getItem('etender_auth');
  if (!userData) return false;

  try {
    const parsedData = JSON.parse(userData);
    return !!parsedData.token;
  } catch {
    return false;
  }
};

export const formatDate = (dateString) => {

   const date= new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  return date;
}