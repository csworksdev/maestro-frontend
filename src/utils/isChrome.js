function isChrome() {
  const userAgent = navigator.userAgent.toLowerCase();
  return /chrome/.test(userAgent) && !/edge|opr|brave/.test(userAgent);
}

export default isChrome;
