var express = require('express');

var router = express.Router();
var productHelpers=require('../helpers/product-helpers')

/* GET users listing. */

router.get('/', function(req, res, next) {
  productHelpers.getAllProduct().then((products)=>{
   
    res.render('admin/view-products',{admin:true,products});
  })

});
router.get('/add-product',(req,res)=>{
  res.render("admin/add-product" ,{admin:true})
});
router.post('/add-product',(req,res)=>{

  
  productHelpers.addproduct(req.body,(id)=>{
    let image=req.files.Image
  image.mv('./public/product-images/'+id+'.png',(err,done)=>{
    if(!err){
      res.render("admin/add-product")
    }
    else{
      console.log(err);
    }
  })

  });

})
router.get('/delete-product/:id',(req,res)=>{
  let productid=req.params.id;
  productHelpers.deleteProduct(productid).then(()=>{
    res.redirect("/admin/") 
  }) 
 
})
router.get('/edit-product/:id',async(req,res)=>{
  let product=await productHelpers.getProductDetails(req.params.id);
  res.render("admin/edit-product",{product})
})
router.post("/edit-product/:id",(req,res)=>{
  productHelpers.updateProduct(req.params.id,req.body).then(()=>{
 
     res.redirect("/admin")
     let image=req.files.Image;
     if(image!=null){
      image.mv('./public/product-images/'+req.params.id+'.png')
     }else{}
     
  })

})

module.exports = router;
