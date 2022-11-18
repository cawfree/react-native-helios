#import <React/RCTBridgeModule.h>

@interface RCT_EXTERN_MODULE(Helios, NSObject)

// explanation about threading here: https://stackoverflow.com/a/50775641/3060739
- (dispatch_queue_t)methodQueue
{
  return dispatch_get_main_queue();
}

+ (BOOL)requiresMainQueueSetup
{
  return YES;
}

RCT_EXTERN_METHOD(start:(NSDictionary*)params resolve:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)
RCT_EXTERN_METHOD(getBlockNumber:(RCTPromiseResolveBlock)resolve reject:(RCTPromiseRejectBlock)reject)

@end
