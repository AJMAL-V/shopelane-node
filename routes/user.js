var express = require('express');
var router = express.Router();
var productHelpers=require('../helpers/product-helpers')
var userhelper=require("../helpers/user-helpers")
/* GET home page. */
router.get('/',async function(req, res, next) {
  let user=req.session.user;
  let cartcount=null;
  if(req.session.user){
    cartcount=await userhelper.getCartCount(req.session.user._id);
  }
   
  productHelpers.getAllProduct().then((products)=>{
    res.render('user/view-products',{products,user,cartcount});
  })

});
router.get("/login",(req,res)=>{
  if(req.session.LoggedIn){
    res.redirect('/');
  }else{
    res.render("user/login",{"loginError":req.session.loginError});
    req.session.loginError=null;
  }
  
})
router.get("/signup",(req,res)=>{
  res.render("user/signup");
})
router.post("/signup",(req,res)=>{
userhelper.doSignUp(req.body).then((response)=>{
  // req.session.LoggedIn=true;
  // req.session.user=response.user;
  res.redirect("/login");  

})
})
router.post('/login',(req,res)=>{
  userhelper.doLogin(req.body).then((response)=>{
    if(response.status){
      req.session.LoggedIn=true;
      req.session.user=response.user;
      res.redirect("/");
    }
    else{
      req.session.loginError="invalid username or password"
      res.redirect("/login");
    }
    
  })
})
router.get('/logout',(req,res)=>{
  req.session.destroy();
  res.redirect('/');
})
const varifylogin=(req,res,next)=>{
  if(req.session.LoggedIn){
    next()
  }else{
    res.redirect('/login')
  }}
router.get('/cart',varifylogin,async (req, res) => {
    var products = await userhelper.getCartProducts(req.session.user._id);
    var total=0;
    let disable=false;
    if(products.length > 0){
     total=await userhelper.getTotalAmount(req.session.user._id)
     disable=true;
    }

    res.render('user/cart',{products,user:req.session.user,total,disable});
  });
  
 
router.get('/add-to-cart/:id',varifylogin,(req,res)=>{
  console.log("api call")
  userhelper.addToCart(req.params.id,req.session.user._id).then(()=>{
    // res.redirect('/');
    res.json({status:true})
  })
}),
router.post('/change-product-quantity',(req,res,next)=>{

userhelper.changeProductQuantity(req.body).then(async(result)=>{
  var products = await userhelper.getCartProducts(req.body.user);
  var total=0;
if(products.length >0){
  total=await userhelper.getTotalAmount(req.body.user)
}



   res.json({result,total});
  
})
}),
router.post('/product-remove',(req,res)=>{
  userhelper.productRemove(req.body).then((resp)=>{
    res.json(resp);
  })
}),
router.get('/place-order',varifylogin, async(req,res)=>{
  let total=await userhelper.getTotalAmount(req.session.user._id)
  res.render('user/place-order',{total,user:req.session.user})
}),
router.post('/place-order',async(req,res)=>{
  //  console.log(req.body)
  let products=await userhelper.getCartProductList(req.body.user)
  let total=req.body.total;
     
  userhelper.placeOrder(req.body,products).then((orderid)=>{
    if(req.body['payment-method']==='COD'){
      res.json({codSuccess:true})
    }else{
      userhelper.genarateRazorpay(orderid,total).then((resp)=>{
        res.json(resp);
      })
    }
   
  })
}),
router.get('/order-success',(req,res)=>{
  res.render('user/order-success',{user:req.session.user})
})
router.get('/orders',varifylogin,async(req,res)=>{
  let orders=await userhelper.getUserOrders(req.session.user._id)
  res.render('user/orders',{user:req.session.user,orders})
}),
router.get('/view-order-products/:id',varifylogin,async(req,res)=>{
  let products=await userhelper.getOrderProducts(req.params.id)

  res.render('user/view-order-products',{user:req.session.user._id,products})
}),
router.post('/verify-payment',(req,res)=>{
  console.log(req.body);
userhelper.varifyPayment(req.body).then((resp)=>{
  userhelper.changePymentStaus(req.body['order[receipt]']).then((resp)=>{
    res.json({status:true})
  })
}).catch((err)=>{
  console.log(err)
  res.json({status:false})
})
})






module.exports = router;
