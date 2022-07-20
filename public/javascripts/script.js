
function addToCart(proid){
  $.ajax({
    url: '/add-to-cart/'+proid,
    method: 'get',
    success:function(results) {
     if(results.status){
      let count=$('#cart-count').html()
      count=parseInt(count)+1
      $('#cart-count').html(count);
     }
    }
});
}