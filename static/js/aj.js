function postr () {
  //make another request
  $.ajax({
    dataType: 'text',
    type: "POST",
    data: {'method':'create', 'path':'M399,49L401,49L405,55L410,70L416,96L419,124L419,138L419,148L415,153L408,153L404,152'},
    url: "/p/" + conf.id,
    error: function (e) {
      console.log(e)
    },
    success: function (r) {
      console.log(r);
    }
});
}