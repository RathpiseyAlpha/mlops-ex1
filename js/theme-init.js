// Runs in <head> before first paint so the saved or system theme shows without a flash.
try{var t=localStorage.getItem('continuous-ml-theme');if(!t)t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.dataset.theme=t}catch(e){}
