(function(){var __sections__={};(function(){for(var i=0,s=document.getElementById("sections-script").getAttribute("data-sections").split(",");i<s.length;i++)__sections__[s[i]]=!0})(),function(){if(__sections__["product-recommendations"])try{const handleIntersection=(entries,observer2)=>{if(!entries[0].isIntersecting)return;observer2.unobserve(productRecommendationsSection);const url=productRecommendationsSection.dataset.url;fetch(url).then(response=>response.text()).then(text=>{const html=document.createElement("div");html.innerHTML=text;const recommendations=html.querySelector(".product-recommendations");recommendations&&recommendations.innerHTML.trim().length&&(productRecommendationsSection.innerHTML=recommendations.innerHTML)}).catch(e=>{console.error(e)})},productRecommendationsSection=document.querySelector(".product-recommendations");new IntersectionObserver(handleIntersection,{rootMargin:"0px 0px 200px 0px"}).observe(productRecommendationsSection)}catch(e){console.error(e)}}()})();
//# sourceMappingURL=/cdn/shop/t/72/compiled_assets/scripts.js.map?34108=
